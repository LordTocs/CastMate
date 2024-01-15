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

export async function authenticateTwinkly(ip: string) {
	const randomBuffer = await randomBytes(32)
	const token = randomBuffer.toString("base64")
	try {
		const resp = await axios.post(
			`login`,
			{
				challenge: token,
			},
			{
				baseURL: `http://${ip}/xled/v1/`,
			}
		)

		const authResp = resp.data as TwinklyAuthResponse

		const verifyResp = await axios.post(
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

		return authResp
	} catch (err) {
		console.error(err)
		return undefined
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

export async function setTwinklyColor(ip: string, token: string, color: LightColor) {
	const parsedColor = LightColor.parse(color)

	if ("hue" in parsedColor) {
		await axios.post(
			`/led/color`,
			{
				hue: parsedColor.hue,
				saturation: (parsedColor.sat / 100) * 255,
				value: (parsedColor.bri / 100) * 255,
			},
			{
				baseURL: `http://${ip}/xled/v1/`,
				headers: {
					"X-Auth-Token": token,
				},
			}
		)
	} else {
		throw new Error("Help this isn't implemented!")
	}

	await axios.post(
		`/led/mode`,
		{
			mode: "color",
			effect_id: 0,
		},
		{
			baseURL: `http://${ip}/xled/v1/`,
			headers: {
				"X-Auth-Token": token,
			},
		}
	)
}

export async function turnTwinklyOff(ip: string, token: string) {
	await axios.post(
		`/led/mode`,
		{
			mode: "off",
			effect_id: 0,
		},
		{
			baseURL: `http://${ip}/xled/v1/`,
			headers: {
				"X-Auth-Token": token,
			},
		}
	)
}
export type TwinklyMode = "off" | "color" | "demo" | "movie" | "rt" | "effect" | "playlist"
export async function getTwinklyMode(ip: string, token: string): Promise<TwinklyMode> {
	const resp = await axios.get(`/led/mode`, {
		baseURL: `http://${ip}/xled/v1/`,
		headers: {
			"X-Auth-Token": token,
		},
	})
	return resp.data.mode
}

export async function getTwinklyColor(ip: string, token: string) {
	const resp = await axios.get(`/led/color`, {
		baseURL: `http://${ip}/xled/v1/`,
		headers: {
			"X-Auth-Token": token,
		},
	})

	return `hsb(${resp.data.hue}, ${resp.data.saturation}, ${resp.data.value})` as LightColor
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
export async function getTwinklyMovies(ip: string, token: string) {
	const resp = await axios.get("movies", {
		baseURL: `http://${ip}/xled/v1/`,
		headers: {
			"X-Auth-Token": token,
		},
	})

	return resp.data as TwinklyMovieQuery
}

export async function setTwinklyMovie(ip: string, token: string, movieId: string) {
	try {
		const resp = await axios.post(
			"movies/current",
			{
				id: movieId,
			},
			{
				baseURL: `http://${ip}/xled/v1/`,
				headers: {
					"X-Auth-Token": token,
				},
			}
		)
	} catch (err) {
		console.error("Failed to set twinkly mode", ip)
	}
}

export async function setTwinklyMode(ip: string, token: string, mode: "movie" | "color") {
	try {
		const resp = await axios.post(
			"led/mode",
			{
				mode,
			},
			{
				baseURL: `http://${ip}/xled/v1/`,
				headers: {
					"X-Auth-Token": token,
				},
			}
		)
	} catch (err) {
		console.error("Failed to set twinkly mode", ip)
	}
}
