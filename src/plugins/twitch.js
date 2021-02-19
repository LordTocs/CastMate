
module.exports = {
	name: "twitch",
	async init(settings, secrets) {
		console.log(settings.channelName)
		console.log(settings.botName);
	},
	settings: {
		botName: { type: String },
		channelName: { type: String},
	},
	secrets: {
		apiClientId: { type: String },
		apiClientSecret: { type: String },
	}
}


