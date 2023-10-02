import { defineAction, defineTrigger, onLoad, onUnload, definePlugin } from "castmate-core"
import axios from "axios"
export default definePlugin(
	{
		id: "http",
		name: "HTTP",
		description: "UI Description",
		icon: "mdi mdi-web",
		color: "#9E436E",
	},
	() => {
		defineAction({
			id: "request",
			name: "HTTP Request",
			icon: "mdi mdi-web",
			config: {
				type: Object,
				properties: {
					method: {
						type: String,
						name: "Method",
						enum: ["GET", "POST", "DELETE", "PUT", "PATCH"],
						required: true,
						default: "GET",
					},
					url: {
						type: String,
						template: true,
						name: "URL",
						required: true,
					},
					//TODO: Query
					//TODO: Headers
					//TODO: Body
				},
			},
			result: {
				type: Object,
				properties: {},
			},
			async invoke(config, contextData, abortSignal) {
				//TODO: Cancel Token
				const resp = await axios.request({
					method: config.method,
					url: config.url,
				})

				return resp.data
			},
		})
	}
)
