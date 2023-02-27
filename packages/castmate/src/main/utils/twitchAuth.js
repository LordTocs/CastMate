import qs from "querystring"
import { userFolder } from "./configuration.js"
import { BrowserWindow } from "./electronBridge.js"
import { FileCache } from "./filecache.js"
import logger from "./logger.js"
import path from "path"
import axios from "axios"
import { StaticAuthProvider } from "@twurple/auth"
const defaultScopes = [
	"bits:read",

	"channel:edit:commercial", //Start ads

	"channel:manage:broadcast", //Change title/category, Stream Markers, Tags
	"user:read:broadcast", //Get current values
	"user:edit:broadcast", //Extensions

	"channel:read:redemptions",
	"channel:manage:redemptions", //Change channel point rewards

	"channel:read:hype_train", //Eventsub Hypetrain... eventually

	"channel:read:subscriptions", //Sub notifications

	"channel:read:polls", //Read the current poll / poll eventsub ... eventually
	"channel:manage:polls", //Start polls

	"channel:read:predictions", //Get the current prediction / prediction eventsub ... eventually
	"channel:manage:predictions", //Start Predictions

	"moderator:read:followers", //Follower eventsub
	"moderator:manage:shoutouts", //create / react to shoutouts

	"clips:edit", //Create clips

	"user:read:email",

	"channel:moderate", //Chat moderation options
	"chat:edit", //Send chat
	"chat:read", //See the chat
]

async function getTokenInfo(token) {
	if (!token?.accessToken) return null
	try {
		const resp = await axios.get("https://id.twitch.tv/oauth2/validate", {
			headers: {
				Authorization: `Bearer ${token.accessToken}`,
			},
		})

		if (resp.data?.user_id) {
			return resp.data
		} else {
			return null
		}
	} catch {
		return null
	}
}

export class ElectronAuthManager {
	constructor({ clientId, name, scopes }) {
		this._clientId = clientId
		this._redirectUri = `http://localhost/auth/channel/redirect`
		this.name = name
		this.scopes = scopes || defaultScopes
		this.cache = new FileCache(
			path.join(userFolder, "secrets", "auth", `${name}.yaml`),
			true
		)
		this.authProvider = null
	}

	get isAuthed() {
		return this._accessToken != null
	}

	get accessToken() {
		return this._accessToken?.accessToken
	}

	get userId() {
		return this._userId
	}

	async init() {
		const token = await this.cache.get()

		if (await this._checkToken(token)) {
			logger.info(`Valid Cached ${this.name} Token`)
		 	return
		}

		logger.info(`No Cached ${this.name} Token. Trying Silent Auth`)
		await this.trySilentAuth()
	}

	async _checkToken(token) {
		const tokenInfo = await getTokenInfo(token)

		if (!tokenInfo) {
			return false
		}

		//TODO: Make sure the scopes match
		const tokenScopes = new Set(tokenInfo.scopes)
		for (let scope of this.scopes) {
			if (!tokenScopes.has(scope)) {
				logger.error(`Token Missing Scope:${scope}`)
				return false
			}
		}

		
		this._accessToken = token
		this._userId = tokenInfo.user_id
		//TODO: Fail the token early incase the cookies in the browser expire at the same time.

		console.log("Creating Auth Provider", this._userId, this._clientId)

		this.authProvider = new StaticAuthProvider(
			this._clientId,
			token.accessToken,
			token.scopes
		)

		return true
	}

	async _setToken(token) {
		if (await this._checkToken(token)) {
			await this.cache.set(token)
		} else {
			this._accessToken = null
			this._userId = null
			this.authProvider = null
		}
	}

	_trySilentAuth() {
		//Tests if auth can succeed silently.
		const promise = new Promise((resolve, reject) => {
			logger.info(`Attempting ${this.name} Twitch Silent Auth`)
			const params = {
				response_type: "token",
				client_id: this._clientId,
				redirect_uri: this._redirectUri,
				scope: this.scopes.join(" "),
			}

			const authUrl = `https://id.twitch.tv/oauth2/authorize?${qs.stringify(
				params
			)}`

			const windowOptions = {
				width: 600,
				height: 600,
				show: false,
				modal: true,
				webPreferences: {
					nodeIntegration: false,
					partition: `persist:twitch${this.name}`,
				},
			}

			let window = new BrowserWindow(windowOptions)

			logger.info(`Doing Silent Auth ${this.name}`)

			window.webContents.session.webRequest.onBeforeRequest(
				(details, callback) => {
					const url = new URL(details.url)
					const matchUrl = url.origin + url.pathname
					logger.info(`  -${matchUrl}`)
					if (matchUrl == this._redirectUri) {
						const respParams = qs.parse(
							details.url.substr(details.url.indexOf("#") + 1)
						)

						if (respParams.error) {
							//todo error!
							logger.info(`  Auth Error: ${respParams.error}`)
							window.destroy()
							reject(respParams.error)
						} else if (respParams.access_token) {
							logger.info("  Auth Success")
							this._setToken({
								accessToken: respParams.access_token,
								scope: [...this.scopes],
								refresh_token: null,
								expiresIn: null,
								obtainmentTimestamp: Date.now(),
							})
								.then(() => {
									resolve({ token: this._accessToken })
								})
								.catch((err) => reject(err))

							window.destroy()
						} else {
							logger.info("  Weird Extra Case")
							for (let key in respParams) {
								logger.info(`  ${key}:${respParams[key]}`)
							}
						}
						callback({ cancel: true })
					} else if (matchUrl.includes("jquery")) {
						//Hacky, assume that if we're loading jquery we've failed auth.
						logger.info(
							"  We've *probably* failed auth because scopes have changed."
						)
						resolve({ error: "scopes_changed" })
						window.destroy()
						callback({ cancel: true })
					} else if (matchUrl == "https://www.twitch.tv/login") {
						logger.info("  No Signin Cookies")
						resolve({ error: "not_signed_in" })
						callback({ cancel: true })
						window.destroy()
					} else {
						callback({})
					}
				}
			)

			window.loadURL(authUrl)
		})

		return promise
	}

	doAuth(forceAuth = false) {
		const promise = new Promise((resolve, reject) => {
			const params = {
				response_type: "token",
				client_id: this._clientId,
				redirect_uri: this._redirectUri,
				scope: this.scopes.join(" "),
				...(forceAuth ? { force_verify: true } : {}),
			}

			const authUrl = `https://id.twitch.tv/oauth2/authorize?${qs.stringify(
				params
			)}`

			const windowOptions = {
				width: 600,
				height: 600,
				show: true,
				modal: true,
				webPreferences: {
					nodeIntegration: false,
					partition: `persist:twitch${this.name}`,
				},
			}

			let window = new BrowserWindow(windowOptions)
			let done = false

			window.webContents.once("did-finish-load", () => window.show())

			window.webContents.on("before-input-event", (_, input) => {
				switch (input.key) {
					case "Esc":
					case "Escape":
						window.close()
						break

					default:
						break
				}
			})

			window.webContents.session.webRequest.onBeforeRequest(
				{ urls: [this._redirectUri] },
				(details, callback) => {
					const url = new URL(details.url)
					const matchUrl = url.origin + url.pathname

					logger.info(`BeforeRequest ${matchUrl}`)
					if (matchUrl == this._redirectUri) {
						const respParams = qs.parse(
							details.url.substr(details.url.indexOf("#") + 1)
						)
						logger.info("RedirectUri Detected")
						done = true
						if (respParams.error || respParams.access_token) {
							window.destroy()
						}

						if (respParams.error) {
							//todo error!
							reject(respParams.error)
							callback({ cancel: true })
						} else if (respParams.access_token) {
							logger.info("Access Token Success")

							this._setToken({
								accessToken: respParams.access_token,
								scope: this.scopes,
								refresh_token: null,
								expiresIn: null,
								obtainmentTimestamp: Date.now(),
							})
								.then(() => {
									resolve(this._accessToken)
								})
								.catch((err) => reject(err))

							callback({ cancel: true })
						}
					} else {
						callback({})
					}
				}
			)

			window.on('closed', () => {
				if (!done) {
					reject(new Error("Window Closed"))
				}
			})

			window.loadURL(authUrl)
		})

		return promise
	}
}
