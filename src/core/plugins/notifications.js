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
			async handler(notificationData, context)
			{
				let notification = { ...notificationData };

				if ("header" in notification)
				{
					notification.header = template(notificationData.header, context);
				}

				if ("text" in notification)
				{
					notification.text = template(notificationData.text, context);
				}

				if ("color" in notification)
				{
					notification.color = template(notificationData.color, context);
				}
				else
				{
					notification.color = this.settings.defaultColor;
				}

				this.webServices.websocketServer.broadcast(JSON.stringify({
					notification
				}));
			}
		}
	}
}