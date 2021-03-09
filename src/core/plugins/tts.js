const { template } = require('../utils/template');
const say = require("say");


module.exports = {
	name: "tts",
	async init() {
	},
	actions: {
		tts: {
			async handler(data, context) {
				say.speak(template(data, context));
			}
		}
	}
}