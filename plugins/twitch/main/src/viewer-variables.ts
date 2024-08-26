import { defineAction, usePluginLogger, ViewerData } from "castmate-core"
import { TwitchViewer } from "castmate-plugin-twitch-shared"
import { DynamicType } from "castmate-schema"
import { ViewerCache } from "./viewer-cache"

export function setupViewerVariables() {
	const logger = usePluginLogger()

	defineAction({
		id: "setViewerVar",
		name: "Set Viewer Variable",
		icon: "mdi mdi-account-alert",
		config: {
			type: Object,
			properties: {
				viewer: { type: TwitchViewer, required: true, name: "Viewer", default: "{{ viewer }}", template: true },
				variable: {
					type: String,
					name: "Variable",
					required: true,
					async enum() {
						return ViewerData.getInstance().variables.map((d) => d.name)
					},
				},
				value: {
					type: DynamicType,
					template: true,
					async dynamicType(context: { variable: string }) {
						const variable = ViewerData.getInstance().getVariable(context.variable)

						if (!variable) {
							return {
								type: String,
								name: "Value",
								required: true,
							}
						}

						return {
							...variable.schema,
							name: "Value",
							template: true,
						}
					},
				},
			},
		},
		async invoke(config, contextData, abortSignal) {
			const viewerDisp = await ViewerCache.getInstance().getDisplayDataById(config.viewer)

			if (!viewerDisp) throw new Error(`Unable to Resolve Twitch Viewer ${config.viewer}`)

			logger.log("Set viewer var", config.variable, config.value, viewerDisp)

			await ViewerData.getInstance().setViewerValue(
				"twitch",
				config.viewer,
				viewerDisp.displayName,
				config.variable,
				config.value
			)
		},
	})

	defineAction({
		id: "offsetViewerVar",
		name: "Offset Viewer Variable",
		icon: "mdi mdi-account-alert",
		config: {
			type: Object,
			properties: {
				viewer: { type: TwitchViewer, required: true, name: "Viewer", default: "{{ viewer }}", template: true },
				variable: {
					type: String,
					name: "Variable",
					required: true,
					async enum() {
						return ViewerData.getInstance()
							.variables.filter((v) => v.schema.type == Number)
							.map((d) => d.name)
					},
				},
				offset: {
					type: DynamicType,
					template: true,
					async dynamicType(context: { variable: string }) {
						const variable = ViewerData.getInstance().getVariable(context.variable)

						if (!variable) {
							return {
								type: String,
								name: "Value",
								required: true,
							}
						}

						return {
							...variable.schema,
							name: "Value",
							template: true,
						}
					},
				},
			},
		},
		async invoke(config, contextData, abortSignal) {
			const viewerDisp = await ViewerCache.getInstance().getDisplayDataById(config.viewer)

			if (!viewerDisp) throw new Error(`Unable to Resolve Twitch Viewer ${config.viewer}`)

			logger.log("Set viewer var", config.variable, config.offset, viewerDisp)

			await ViewerData.getInstance().offsetViewerValue(
				"twitch",
				config.viewer,
				viewerDisp.displayName,
				config.variable,
				config.offset
			)
		},
	})
}
