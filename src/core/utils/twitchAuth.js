
const qs = require('querystring');
const { AccessToken } = require('twitch-auth');
const { BrowserWindow } = require('electron');
const logger = require('./logger');

const scopes = [
	"analytics:read:extensions",
	"analytics:read:games",
	"bits:read",
	"channel:edit:commercial",
	"channel:read:hype_train",
	"channel:read:subscriptions",
	"channel:read:redemptions",
	"channel:manage:redemptions",
	"channel:manage:broadcast",
	"channel_subscriptions",
	"clips:edit",
	"user:edit",
	"user_read",
	"user:edit:broadcast",
	"user:edit:follows",
	"user:read:broadcast",
	"user:read:email",
	"channel:moderate",
	"chat:edit",
	"chat:read",
	"whispers:read",
	"whispers:edit"
]

class ElectronAuthManager
{
	constructor({ clientId, redirectUri, name })
	{
		this._clientId = clientId;
		this._redirectUri = redirectUri;
		this.name = name;
	}

	get clientId()
	{
		return this._clientId;
	}

	get currentScopes()
	{
		return Array.from(this._currentScopes);
	}

	get tokenType()
	{
		return 'user';
	}

	get isAuthed()
	{
		return this._accessToken != null;
	}

	trySilentAuth()
	{
		//Tests if auth can succeed silently.
		const promise = new Promise((resolve, reject) =>
		{
			logger.info(`Attempting ${this.name} Twitch Silent Auth`)
			const params = {
				response_type: "token",
				client_id: this._clientId,
				redirect_uri: this._redirectUri,
				scope: scopes.join(' ')
			}

			const authUrl = `https://id.twitch.tv/oauth2/authorize?${qs.stringify(params)}`

			const windowOptions = {
				width: 600,
				height: 600,
				show: false,
				modal: true,
				webPreferences: {
					nodeIntegration: false,
					partition: `persist:twitch${this.name}`
				}
			}

			let window = new BrowserWindow(windowOptions);

			window.webContents.session.webRequest.onBeforeRequest((details, callback) =>
			{
				const url = new URL(details.url);
				const matchUrl = url.origin + url.pathname;

				logger.info(`Silent ${this.name} BeforeRequest`, matchUrl);
				if (matchUrl == this._redirectUri)
				{
					const respParams = qs.parse(details.url.substr(details.url.indexOf('#') + 1));
					logger.info("RedirectUri Detected");
					if (respParams.error || respParams.access_token)
					{
						window.destroy();
					}

					if (respParams.error)
					{
						//todo error!
						reject(respParams.error);
					}
					else if (respParams.access_token)
					{
						this._accessToken = new AccessToken({
							access_token: respParams.access_token,
							scope: scopes,
							refresh_token: ''
						})

						this._currentScopes = new Set(scopes);

						//todo return this sucker.
						resolve(this._accessToken);
						logger.info("Resolved");
					}
					callback({ cancel: true });
				}
				else if (matchUrl == "https://www.twitch.tv/login")
				{
					resolve(false);
					callback({ cancel: true });
					window.destroy();
				}
				else
				{
					callback({});
				}
			});

			window.loadURL(authUrl).then(() =>
			{
				let fullUrl = window.webContents.getURL();
				const url = new URL(fullUrl);
				const matchUrl = url.origin + url.pathname;

				if (matchUrl == "https://id.twitch.tv/oauth2/authorize")
				{
					resolve(false);
					window.destroy();
				}
			});
		});

		return promise;
	}

	doAuth(forceAuth = false)
	{
		const promise = new Promise((resolve, reject) =>
		{
			const params = {
				response_type: "token",
				client_id: this._clientId,
				redirect_uri: this._redirectUri,
				scope: scopes.join(' '),
				...forceAuth ? { force_verify: true } : {}
			}

			const authUrl = `https://id.twitch.tv/oauth2/authorize?${qs.stringify(params)}`

			const windowOptions = {
				width: 600,
				height: 600,
				show: true,
				modal: true,
				webPreferences: {
					nodeIntegration: false,
					partition: `persist:twitch${this.name}`
				}
			}

			let window = new BrowserWindow(windowOptions);

			window.webContents.once('did-finish-load', () => window.show());

			window.webContents.session.webRequest.onBeforeRequest({ urls: [this._redirectUri] }, (details, callback) =>
			{
				const url = new URL(details.url);
				const matchUrl = url.origin + url.pathname;

				logger.info(`BeforeRequest ${matchUrl}`);
				if (matchUrl == this._redirectUri)
				{
					const respParams = qs.parse(details.url.substr(details.url.indexOf('#') + 1));
					logger.info("RedirectUri Detected");
					if (respParams.error || respParams.access_token)
					{
						window.destroy();
					}

					if (respParams.error)
					{
						logger.info("Error!");
						//todo error!
						reject(respParams.error);
						callback({ cancel: true });
					}
					else if (respParams.access_token)
					{
						logger.info("Access Token Success");
						this._accessToken = new AccessToken({
							access_token: respParams.access_token,
							scope: scopes,
							refresh_token: ''
						})

						this._currentScopes = new Set(scopes);

						//todo return this sucker.
						resolve(this._accessToken);
						callback({ cancel: true });
					}
				}
				else
				{
					callback({});
				}
			});

			window.loadURL(authUrl);
		});

		return promise;
	}

	async getAccessToken()
	{
		if (this._accessToken)
		{
			return this._accessToken;
		}
	}

	setAccessToken(token)
	{
		this._accessToken = token;
	}

	get refresh()
	{
		return null;
	}
}


module.exports = { ElectronAuthManager };


