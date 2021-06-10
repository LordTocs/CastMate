const { template } = require('../utils/template');


module.exports = {
	name: "notifications",
	uiName: "Notifications",
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
			name: "Notification",
			data: {
				type: Object,
				properties: {
					header: { type: "TemplateString", name: "Header" },
					text: { type: "TemplateString", name: "Text" },
					color: { type: "TemplateString", name: "Color" },
				}
			},
			async handler(notificationData, context)
			{
				let notification = { ...notificationData };

				if ("header" in notification)
				{
					notification.header = await template(notificationData.header, context);
				}

				if ("text" in notification)
				{
					notification.text = await template(notificationData.text, context);
				}

				if ("color" in notification)
				{
					notification.color = await template(notificationData.color, context);
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