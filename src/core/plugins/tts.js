const { template } = require('../utils/template');
const say = require("say");


module.exports = {
	name: "tts",
	uiName: "Text to Speech",
	async init()
	{

	},
	actions: {
		tts: {
			name: "Text to Speech",
			color: "#717287",
			data: {
				type: String,
				template: true,
			},
			async handler(data, context)
			{
				const message = await template(data, context);
				this.logger.info(`Speaking: ${message}`);
				say.speak(message);
			}
		}
	}
}