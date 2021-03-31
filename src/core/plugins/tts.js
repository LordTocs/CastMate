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
			data: {
				type: "TemplateString"
			},
			async handler(data, context)
			{
				say.speak(template(data, context));
			}
		}
	}
}