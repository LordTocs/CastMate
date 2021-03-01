const { template } = require('../utils/template');


module.exports = {
	name: "variables",
	async init()
	{

	},
	settings: {
		defaultColor: {
			type: String,
			description: "Default color for a notification."
		}
	},
	secrets: {
	},
	actions: {
		notification: {
			async handler(notificationData)
			{
				if ("header" in notificationData)
				{
					notificationData.header = template(notificationData.header);
				}

				if ("text" in notificationData)
				{
					notificationData.text = template(notificationData.text);
				}

				if ("color" in notificationData)
				{
					notificationData.color = template(notificationData.color);
				}
				else
				{
					notificationData.color = this.settings.defaultColor;
				}

				this.webServices.websocketServer.broadcast(JSON.stringify({
					notification: notificationData
				}));
			}
		}
	}
}