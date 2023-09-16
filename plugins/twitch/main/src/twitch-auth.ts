import { TwitchAccountConfig, TwitchAccountSecrets } from "castmate-plugin-twitch-shared"
import { Account, ResourceStorage } from "castmate-core"
import { getTokenInfo, AuthProvider, AccessTokenWithUserId, AccessTokenMaybeWithUserId } from "@twurple/auth"
import { BrowserWindow } from "electron"
import { ApiClient, UserIdResolvable } from "@twurple/api"
import * as qs from "querystring"

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

	"channel:read:vips", //Read and manage vips
	"channel:manage:vips",

	"moderation:read",
	"channel:manage:moderators",

	"clips:edit", //Create clips

	"user:read:email",

	"channel:moderate", //Chat moderation options
	"chat:edit", //Send chat
	"chat:read", //See the chat
]

const CLIENT_ID = "qnybd4aoxlom3u3wjbsstsp5yd2sdl"
const REDIRECT_URL = `http://localhost/auth/channel/redirect` //Note we don't actually load this redirect URL, the BrowserWindow hooks a redirect to it and pulls the creds before it's loaded.

export class TwitchAccount extends Account<TwitchAccountSecrets, TwitchAccountConfig> implements AuthProvider {
	static storage = new ResourceStorage<TwitchAccount>("TwitchAccount")
	static accountDirectory: string = "twitch"

	constructor() {
		super()
		this._secrets = {
			accessToken: "",
		}
		this._config = {
			twitchId: "",
			name: "",
			scopes: defaultScopes,
		}
	}

	async checkToken(token: string) {
		const info = await getTokenInfo(token, CLIENT_ID)

		if (!info.userId || !info.userName) {
			return false
		}

		for (const requiredScope of this.config.scopes) {
			if (!info.scopes.includes(requiredScope)) {
				console.log("Missing Scope", requiredScope)
				return false
			}
		}

		await this.applyConfig({
			//scopes: info.scopes,
			twitchId: info.userId,
		})

		return true
	}

	async checkCachedCreds(): Promise<boolean> {
		if (!this.secrets.accessToken) return false
		if (await this.checkToken(this.secrets.accessToken)) {
			await this.finishAuth()
			return true
		}
		return false
	}

	//Twitch doesn't issue refresh tokens for token auth requests
	//Instead we use a persistent BrowserWindow partition to hold the sign in cookies.
	//Then if we go to the auth page again and the cookies/session are still valid
	//We'll get a new token
	async refreshCreds(): Promise<boolean> {
		const accessToken = await this.tryCookies() //TODO Timeout?
		if (accessToken) {
			if (await this.checkToken(accessToken)) {
				await this.setSecrets({
					accessToken,
				})

				await this.finishAuth()
				return true
			}
		}
		return false
	}

	private tryCookies() {
		return new Promise<string | null>((resolve, reject) => {
			const authUrl = this.getAuthURL(this.config.scopes, false)

			const window = new BrowserWindow({
				width: 600,
				height: 600,
				show: false,
				modal: true,
				webPreferences: {
					nodeIntegration: false,
					partition: `persist:twitch-${this.id}`,
				},
			})

			window.webContents.session.webRequest.onBeforeRequest((details, callback) => {
				const url = new URL(details.url)
				const matchUrl = url.origin + url.pathname
				//logger.info(`  -${matchUrl}`)
				if (matchUrl == REDIRECT_URL) {
					const respParams = qs.parse(details.url.substring(details.url.indexOf("#") + 1))

					if (respParams.error) {
						//todo error!
						//logger.info(`  Auth Error: ${respParams.error}`)
						window.destroy()
						reject(respParams.error)
					} else if (respParams.access_token && !Array.isArray(respParams.access_token)) {
						//logger.info("  Auth Success")
						resolve(respParams.access_token)
						window.destroy()
					} else {
						//logger.info("  Weird Extra Case")
						for (let key in respParams) {
							//logger.info(`  ${key}:${respParams[key]}`)
						}
					}
					//@ts-ignore This seems to be an electron type error
					callback({ cancel: true })
				} else if (matchUrl.includes("jquery")) {
					// If our scopes changed for whatever reason we need a way to detect this.
					// The easiest way I found was to check if we load jquery. This isn't a
					// permanent solution but good enough. We'll add a timeout for good measure.

					// logger.info(
					// 	"  We've *probably* failed auth because scopes have changed."
					// )
					resolve(null)
					window.destroy()
					//@ts-ignore This seems to be an electron type error
					callback({ cancel: true })
				} else if (matchUrl == "https://www.twitch.tv/login") {
					//logger.info("  No Signin Cookies")
					resolve(null)
					//@ts-ignore This seems to be an electron type error
					callback({ cancel: true })
					window.destroy()
				} else {
					//@ts-ignore This seems to be an electron type error
					callback({})
				}
			})

			window.loadURL(authUrl)
		})
	}

	private _apiClient: ApiClient
	get apiClient(): ApiClient {
		return this._apiClient
	}

	get twitchId() {
		return this.config.twitchId
	}

	// Twurple Auth provider interface
	get clientId() {
		return CLIENT_ID
	}

	async getAccessTokenForUser(
		user: UserIdResolvable,
		...scopeSets: Array<string[] | undefined>
	): Promise<AccessTokenWithUserId | null> {
		//if (!this.state.authenticated) return null
		return {
			accessToken: this.secrets.accessToken,
			refreshToken: null,
			scope: this.config.scopes,
			expiresIn: null,
			obtainmentTimestamp: Date.now(),
			userId: this.config.twitchId,
		}
	}

	async getAccessTokenForIntent(
		intent: string,
		...scopeSets: Array<string[] | undefined>
	): Promise<AccessTokenWithUserId> {
		return {
			accessToken: this.secrets.accessToken,
			refreshToken: null,
			scope: this.config.scopes,
			expiresIn: null,
			obtainmentTimestamp: Date.now(),
			userId: this.config.twitchId,
		}
	}

	async getAnyAccessToken(): Promise<AccessTokenMaybeWithUserId> {
		return {
			accessToken: this.secrets.accessToken,
			refreshToken: null,
			scope: this.config.scopes,
			expiresIn: null,
			obtainmentTimestamp: Date.now(),
			userId: this.config.twitchId,
		}
	}

	getCurrentScopesForUser(user: UserIdResolvable): string[] {
		return this.config.scopes
	}
	///

	protected async finishAuth() {
		console.log("Finishing Auth")
		this._apiClient = new ApiClient({
			authProvider: this,
		})

		const user = await this.apiClient.users.getAuthenticatedUser(this.config.twitchId)

		await this.applyConfig({
			name: user.displayName,
			icon: user.profilePictureUrl,
		})

		this.state.authenticated = true

		await super.finishAuth()
	}

	private getAuthURL(scopes: string[], forceAuth: boolean = false) {
		const authorizeParams = {
			response_type: "token",
			client_id: CLIENT_ID,
			redirect_uri: REDIRECT_URL,
			scope: scopes.join(" "),
			...(forceAuth ? { force_verify: true } : {}),
		}

		return `https://id.twitch.tv/oauth2/authorize?${qs.stringify(authorizeParams)}`
	}

	private forceLogin(scopes: string[]) {
		return new Promise<string>((resolve, reject) => {
			const authUrl = this.getAuthURL(scopes, false)

			const window = new BrowserWindow({
				width: 600,
				height: 600,
				show: true,
				modal: true,
				webPreferences: {
					nodeIntegration: false,
					partition: `persist:twitch-${this.id}`,
				},
			})

			//Do we need this, show is true in the config
			//window.webContents.once("did-finish-load", () => window.show())

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

			let done = false

			window.webContents.session.webRequest.onBeforeRequest({ urls: [REDIRECT_URL] }, (details, callback) => {
				const url = new URL(details.url)
				const matchUrl = url.origin + url.pathname

				//logger.info(`BeforeRequest ${matchUrl}`)
				if (matchUrl == REDIRECT_URL) {
					const respParams = qs.parse(details.url.substring(details.url.indexOf("#") + 1))
					//logger.info("RedirectUri Detected")
					done = true
					if (respParams.error || respParams.access_token) {
						window.destroy()
					}

					if (respParams.error) {
						//todo error!
						reject(respParams.error)
						//@ts-ignore This seems to be an electron type error
						callback({ cancel: true })
					} else if (respParams.access_token && !Array.isArray(respParams.access_token)) {
						//logger.info("Access Token Success")

						const accessToken = respParams.access_token
						resolve(accessToken)
						//@ts-ignore This seems to be an electron type error
						callback({ cancel: true })
					}
				} else {
					//@ts-ignore This seems to be an electron type error
					callback({})
				}
			})

			window.on("closed", () => {
				if (!done) {
					reject(new Error("Window Closed"))
				}
			})

			window.loadURL(authUrl)
		})
	}

	async login(): Promise<boolean> {
		try {
			const accessToken = await this.forceLogin(this.config.scopes)

			if (await this.checkToken(accessToken)) {
				await this.setSecrets({
					accessToken,
				})
				await this.finishAuth()
				return true
			}
		} catch (err) {
			console.error("Error Logging In", err)
		}

		return false
	}

	static async initialize(): Promise<void> {
		await super.initialize()

		const channel = new TwitchAccount()
		channel._id = "channel"
		await channel.load()
		await this.storage.inject(channel)
	}

	static async uninitialize(): Promise<void> {
		await super.uninitialize()
	}

	static get channel() {
		const channel = this.storage.getById("channel")
		if (!channel) throw new Error(`TwitchAccount resource hasn't been initialized`)
		return channel
	}
}
