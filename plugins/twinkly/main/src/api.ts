import axios from "axios"
import { LightColor } from "castmate-plugin-iot-shared"
import crypto from "crypto"

export interface TwinklyAuthResponse {
	["challenge-response"]: string
	authentication_token: string
	authentication_token_expires_in: number
}

function randomBytes(num: number) {
	return new Promise<Buffer>((resolve, reject) => {
		crypto.randomBytes(num, (err, buf) => {
			if (err) {
				reject(err)
			}
			resolve(buf)
		})
	})
}

export interface TwinklyAuthToken {
	token: string | undefined
	expiry: number | undefined
}

export async function authenticateTwinkly(ip: string, token: TwinklyAuthToken) {
	const randomBuffer = await randomBytes(32)
	const challenge = randomBuffer.toString("base64")
	try {
		const resp = await axios.post(
			`login`,
			{
				challenge,
			},
			{
				baseURL: `http://${ip}/xled/v1/`,
			}
		)

		const authResp = resp.data as TwinklyAuthResponse

		await axios.post(
			"verify",
			{
				"challenge-response": authResp["challenge-response"],
			},
			{
				baseURL: `http://${ip}/xled/v1/`,
				headers: {
					"X-Auth-Token": authResp.authentication_token,
				},
			}
		)

		console.log("Authenticating Twinkly", ip)
		token.token = authResp.authentication_token
		token.expiry = Date.now() + authResp.authentication_token_expires_in * 1000 - 5 * 1000

		console.log(token)

		return true
	} catch (err) {
		console.error("Failed Twinkly Auth", err.response.data)
		console.error(err)
		return false
	}
}

function hasAuth(token: TwinklyAuthToken): token is { token: string; expiry: number } {
	if (token.token == null) return false
	if (token.expiry == null) return false
	const now = Date.now()
	if (token.expiry < now) {
		console.log("Token Expired", token.expiry, now)
		return false
	}
	return true
}

export async function getTwinklyApi<T>(ip: string, token: TwinklyAuthToken, path: string) {
	if (!hasAuth(token)) {
		console.error(`token invalid in get ${path}`)
		await authenticateTwinkly(ip, token)
	}

	try {
		const resp = await axios.get(path, {
			baseURL: `http://${ip}/xled/v1/`,
			headers: {
				"X-Auth-Token": token.token,
			},
		})

		return resp.data as T
	} catch (err) {
		console.log("Error w/", path)
		console.log(err.response.data)
		if (err.response.data == "Invalid Token") {
			console.error(`get ${path} failed, reauthing`)
			//Somebody invalidated our token, try again
			await authenticateTwinkly(ip, token)

			const resp = await axios.get(path, {
				baseURL: `http://${ip}/xled/v1/`,
				headers: {
					"X-Auth-Token": token.token,
				},
			})

			return resp.data as T
		} else {
			throw err
		}
	}
}

export async function postTwinklyApi<T>(ip: string, token: TwinklyAuthToken, path: string, data: object) {
	if (!hasAuth(token)) {
		console.error(`token invalid in post ${path}`)
		await authenticateTwinkly(ip, token)
	}

	try {
		const resp = await axios.post(path, data, {
			baseURL: `http://${ip}/xled/v1/`,
			headers: {
				"X-Auth-Token": token.token,
			},
		})

		return resp.data as T
	} catch (err) {
		if (err.response.data == "Invalid Token") {
			console.error(`post ${path} failed, reauthing`)
			//Somebody invalidated our token, try again
			await authenticateTwinkly(ip, token)

			const resp = await axios.post(path, data, {
				baseURL: `http://${ip}/xled/v1/`,
				headers: {
					"X-Auth-Token": token.token,
				},
			})

			return resp.data as T
		} else {
			throw err
		}
	}
}

export interface TwinklyGestaltResponse {
	product_name: string
	product_version: string
	hardware_version: string
	bytes_per_led: number
	flash_size: number
	device_name: string
	mac: string
	led_profile: "RGB" | "RGBW"
	uuid: string
}

export async function getTwinklyInfo(ip: string) {
	const resp = await axios.get(`gestalt`, {
		baseURL: `http://${ip}/xled/v1/`,
	})

	const gestalt = resp.data as TwinklyGestaltResponse
	return gestalt
}

export async function setTwinklyColor(ip: string, token: TwinklyAuthToken, color: LightColor) {
	const parsedColor = LightColor.parse(color)

	if ("hue" in parsedColor) {
		await postTwinklyApi(ip, token, `/led/color`, {
			hue: parsedColor.hue,
			saturation: (parsedColor.sat / 100) * 255,
			value: (parsedColor.bri / 100) * 255,
		})
	} else {
		throw new Error("Help this isn't implemented!")
	}

	await await postTwinklyApi(ip, token, `/led/mode`, {
		mode: "color",
		effect_id: 0,
	})
}

export async function turnTwinklyOff(ip: string, token: TwinklyAuthToken) {
	await postTwinklyApi(ip, token, `/led/mode`, {
		mode: "off",
		effect_id: 0,
	})
}
export type TwinklyMode = "off" | "color" | "demo" | "movie" | "rt" | "effect" | "playlist"
export async function getTwinklyMode(ip: string, token: TwinklyAuthToken): Promise<TwinklyMode> {
	const data = await getTwinklyApi<{ mode: TwinklyMode }>(ip, token, "/led/mode")
	return data.mode
}

export async function getTwinklyColor(ip: string, token: TwinklyAuthToken) {
	const data = await getTwinklyApi<{ hue: number; saturation: number; value: number }>(ip, token, "/led/color")

	return `hsb(${data.hue}, ${data.saturation}, ${data.value})` as LightColor
}

export interface TwinklyMovie {
	id: string
	name: string
	unique_id: string
	descriptor_type: string
	leds_per_frame: number
	frames_number: number
	fps: number
}

export interface TwinklyMovieQuery {
	code: number
	movies: TwinklyMovie[]
}

//https://xled-docs.readthedocs.io/en/latest/rest_api.html#get-list-of-movies
export async function getTwinklyMovies(ip: string, token: TwinklyAuthToken) {
	return await getTwinklyApi<TwinklyMovieQuery>(ip, token, "movies")
}

export async function setTwinklyMovie(ip: string, token: TwinklyAuthToken, movieId: string) {
	try {
		await postTwinklyApi(ip, token, "movies/current", {
			id: movieId,
		})
	} catch (err) {
		console.error("Failed to set twinkly movie", ip)
	}

	await await postTwinklyApi(ip, token, `/led/mode`, {
		mode: "movie",
		effect_id: 0,
	})
}
