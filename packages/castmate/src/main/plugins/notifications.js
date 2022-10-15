import { template } from '../utils/template.js'


export default {
	name: "notifications",
	uiName: "Alerts",
	icon: "mdi-alert-box-outline",
	color: "#CC63A2",
	async init()
	{

	},
	settings: {
		defaultColor: {
			type: String,
			name: "Default Alert Color",
			description: "Default color for a Alert."
		}
	},
	secrets: {
	},
	actions: {
		notification: {
			name: "Alert",
			description: "Shows an Alert in the OBS browser",
			icon: "mdi-alert-box-outline",
			color: "#CC63A2",
			data: {
				type: Object,
				properties: {
					header: { type: String, template: true, name: "Header" },
					text: { type: String, template: true, name: "Text" },
					color: { type: String, template: true, name: "Color" },
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