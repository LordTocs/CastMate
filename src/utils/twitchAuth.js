const axios = require('axios');
const qs = require('querystring');
const fs = require('fs');
const { AccessToken, RefreshableAuthProvider, StaticAuthProvider } = require('twitch-auth');

const scopes = [
	"analytics:read:extensions",
	"analytics:read:games",
	"bits:read",
	"channel:edit:commercial",
	"channel:read:hype_train",
	"channel:read:subscriptions",
	"channel:read:redemptions",
	"channel:manage:redemptions",
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

class AuthManager
{
	constructor(name)
	{
		this.name = name;
		this.authPromise = null;
		this.authResolver = null;
		this.accessToken = null;
		try
		{
			let tokenJson = JSON.parse(fs.readFileSync(`./secrets/${this.name}Tokens.json`, 'utf-8'));
			let obtainmentDate = new Date(tokenJson.obtainment_date);
			let tokens = tokenJson;
			this.accessToken = new AccessToken(tokens, obtainmentDate);
		}
		catch (err)
		{ }
	}

	setClientInfo(clientId, clientSecret)
	{
		this.clientId = clientId;
		this.clientSecret = clientSecret;
	}

	async doAuth()
	{
		if (this.accessToken)
		{
			return this.accessToken;
		}

		this.authPromise = new Promise((resolve) =>
		{
			this.authResolver = resolve;
		});

		console.log(`Auth is required as ${this.name}`);
		console.log(`Go to http://localhost/auth/${this.name}/ to sign in. If you're signing into a bot account go in incognito`);

		let tokenResp = await this.authPromise;
		let obtainment_date = new Date();

		fs.writeFileSync(`./secrets/${this.name}Tokens.json`, JSON.stringify({ ...tokenResp, obtainment_date }, null, 4), 'utf-8');
		this.accessToken = new AccessToken(tokenResp, obtainment_date);

		return this.accessToken;

	}

	createAuthProvider()
	{
		if (!this.accessToken)
			throw new Error("You forgot to auth before creating the provider")

		const authProvider = new RefreshableAuthProvider(new StaticAuthProvider(this.clientId, this.accessToken.accessToken, scopes), {
			clientSecret: this.clientSecret,
			refreshToken: this.accessToken.refreshToken,
			expiry: this.accessToken.expiryDate ? this.accessToken.expiryDate : null,
			onRefresh: async (tokenData) =>
			{
				let tokenDataObj = tokenData; //Hack our way into privates.
				fs.writeFileSync(`./secrets/${this.name}Tokens.json`, JSON.stringify({ ...tokenDataObj['_data'], obtainment_date: tokenDataObj["_obtainmentDate"] }, null, 4), 'utf-8');
			}
		});

		return authProvider;
	}

	async completeAuth(access_code)
	{
		if (!this.authResolver)
		{
			return;
		}

		let response;
		try
		{
			response = await axios.post(
				'https://id.twitch.tv/oauth2/token',
				qs.stringify({
					client_id: this.clientId,
					client_secret: this.clientSecret,
					grant_type: 'authorization_code',
					redirect_uri: `http://localhost/auth/${this.name}/redirect`,
					code: access_code
				}),
				{
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded',
					},
				}
			)
		} catch (err)
		{
			console.error(`Auth Error: ${err}`);
			throw new Error('Error something happened.');
		}

		this.authResolver(response.data);
		this.authResolver = null;
	}


	installMiddleware(app)
	{
		app.get(`/auth/${this.name}`, (req, res, next) =>
		{
			let redirectUri = `http://localhost/auth/${this.name}/redirect`;
			res.redirect(`https://id.twitch.tv/oauth2/authorize?response_type=code&client_id=${this.clientId}&redirect_uri=${redirectUri}&scope=${scopes.join('+')}`);
		});

		app.get(`/auth/${this.name}/redirect`, async (req, res, next) =>
		{
			if (!req.query.code)
			{
				let error = req.query.error;
				let errorMsg = req.query.error_description;
				console.error("Auth Error", error, errorMsg);
				throw new Error(`Error: ${error}: ${errorMsg}`);
			}
			this.completeAuth(req.query.code);
			res.status(200).send("Complete!");
		});
	}
}

module.exports = AuthManager;


