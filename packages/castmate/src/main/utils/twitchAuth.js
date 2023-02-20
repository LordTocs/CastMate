import qs from "querystring"
import { BrowserWindow } from "./electronBridge.js"
import logger from "./logger.js"

const defaultScopes = [
	"bits:read",

	"channel:edit:commercial", //Start ads

	"channel:manage:broadcast", //Change title/category, Stream Markers, Tags
	"user:read:broadcast", //Get current values

	"channel:read:redemptions",
	"channel:manage:redemptions", //Change channel point rewards

	"channel:read:hype_train", //Eventsub Hypetrain... eventually

	"channel:read:subscriptions", //Sub notifications

	"channel:read:polls", //Read the current poll / poll eventsub ... eventually
	"channel:manage:polls", //Start polls

	"channel:read:predictions", //Get the current prediction / prediction eventsub ... eventually
	"channel:manage:predictions", //Start Predictions

	"clips:edit", //Create clips

	"user:read:email",

	"channel:moderate", //Chat moderation options
	"chat:edit", //Send chat
	"chat:read", //See the chat
]

export class ElectronAuthManager {
	constructor({ clientId, redirectUri, name, scopes }) {
		this._clientId = clientId
		this._redirectUri = redirectUri
		this.name = name
		this.scopes = scopes || defaultScopes
	}

	get clientId() {
		return this._clientId
	}

	get currentScopes() {
		return Array.from(this._currentScopes)
	}

	get tokenType() {
		return "user"
	}

	get isAuthed() {
		return this._accessToken != null
	}

	trySilentAuth() {
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
							this._accessToken = {
								accessToken: respParams.access_token,
								scope: this.scopes,
								refresh_token: null,
								expiresIn: null,
								obtainmentTimestamp: Date.now(),
							}

							this._currentScopes = new Set(this.scopes)

							logger.info("  Auth Success")
							resolve({ accessToken: this._accessToken })
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

			window.webContents.once("did-finish-load", () => window.show())

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
						if (respParams.error || respParams.access_token) {
							window.destroy()
						}

						if (respParams.error) {
							//todo error!
							reject(respParams.error)
							callback({ cancel: true })
						} else if (respParams.access_token) {
							logger.info("Access Token Success")
							this._accessToken = {
								accessToken: respParams.access_token,
								scope: this.scopes,
								refresh_token: null,
								expiresIn: null,
								obtainmentTimestamp: Date.now(),
							}

							this._currentScopes = new Set(this.scopes)

							//todo return this sucker.
							resolve(this._accessToken)
							callback({ cancel: true })
						}
					} else {
						callback({})
					}
				}
			)

			window.loadURL(authUrl)
		})

		return promise
	}

	async getAccessToken() {
		if (this._accessToken) {
			return this._accessToken
		}
	}

	setAccessToken(token) {
		this._accessToken = token
	}

	get refresh() {
		return null
	}
}
