const AuthManager = require("../utils/twitchAuth");

const { ApiClient, HelixFollow } = require("twitch");

const { ChatClient } = require("twitch-chat-client");


let botAuth = new AuthManager("bot");
let channelAuth = new AuthManager("channel");

let channelTwitchClient = null;
let botTwitchClient = null;

let channelId = null;
let botId = null;

let chatClient = null;

module.exports = {
	name: "twitch",
	async init(settings, secrets, webServices)
	{

		channelAuth.setClientInfo(secrets.apiClientId, secrets.apiClientSecret);

		//Do the channel authentication
		channelAuth.installMiddleware(webServices.app);

		await channelAuth.doAuth();

		let chatAuthProvider = channelAuth.createAuthProvider()

		channelTwitchClient = new ApiClient({
			authProvider: chatAuthProvider,
		});

		if (settings.botName != settings.channelName)
		{
			botAuth.setClientInfo(secrets.apiClientId, secrets.apiClientSecret);
			//Do the bot authentication only if there's a different bot name
			botAuth.installMiddleware(webServices.app);
			await botAuth.doAuth();

			chatAuthProvider = botAuth.createAuthProvider()

			botTwitchClient = new ApiClient({
				authProvider: chatAuthProvider
			});
		}
		else
		{
			botTwitchClient = channelTwitchClient;
		}

		//Get the IDs

		channelId = await (await channelTwitchClient.kraken.users.getMe()).id;
		botId = await (await botTwitchClient.kraken.users.getMe()).id;

		chatClient = new ChatClient(chatAuthProvider, { channels: [settings.channelName] });
		await chatClient.connect();

		try
		{
			let sayChannel = settings.channelName.toLowerCase();
			await chatClient.say(sayChannel, "StreamMachine is now running.");
		}
		catch (err)
		{
			console.log("Hello!");
		}
	},
	settings: {
		botName: { type: String },
		channelName: { type: String },
	},
	secrets: {
		apiClientId: { type: String },
		apiClientSecret: { type: String },
	}
}


