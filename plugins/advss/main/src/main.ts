import {
	defineAction,
	defineTrigger,
	onLoad,
	onUnload,
	definePlugin,
	useSetting,
	getSettingValue,
	defineTransformTrigger,
} from "castmate-core"
import { OBSConnection, onOBSWebsocketEvent } from "castmate-plugin-obs-main"
import { Command, getCommandDataSchema, matchAndParseCommand } from "castmate-schema"

export default definePlugin(
	{
		id: "advss",
		name: "Advanced Scene Switcher",
		description: "Integration for Advanced Scene Switcher by WarmUpTill",
		color: "#256eff",
		icon: "obsi obsi-obs",
	},
	() => {
		defineAction({
			id: "AdvSSMessage",
			name: "Advanced Scene Switcher Message",
			config: {
				type: Object,
				properties: {
					obs: {
						type: OBSConnection,
						name: "OBS Connection",
						required: true,
						default: () => getSettingValue<OBSConnection>("obs", "obsDefault"),
					},
					message: { type: String, required: true, name: "Message", template: true },
				},
			},
			async invoke(config, contextData, abortSignal) {
				await config.obs.connection.call("CallVendorRequest", {
					vendorName: "AdvancedSceneSwitcher",
					requestType: "AdvancedSceneSwitcherMessage",
					requestData: {
						message: config.message,
					},
				})
			},
		})

		const advssEvent = defineTransformTrigger({
			id: "advssEvent",
			name: "Advanced Scene Switcher Event",
			config: {
				type: Object,
				properties: {
					obs: {
						type: OBSConnection,
						name: "OBS Connection",
						required: true,
						default: () => getSettingValue<OBSConnection>("obs", "obsDefault"),
					},
					message: { type: Command, required: true, name: "Message" },
				},
			},
			invokeContext: {
				type: Object,
				properties: {
					obs: {
						type: OBSConnection,
						name: "OBS Connection",
						required: true,
						default: () => getSettingValue<OBSConnection>("obs", "obsDefault"),
					},
					message: { type: String, required: true, name: "Message" },
				},
			},
			async context(config) {
				return {
					type: Object,
					properties: {
						message: { type: String, required: true, default: "Thanks for using CastMate!" },
						...getCommandDataSchema(config.message).properties,
					},
				}
			},
			async handle(config, context, mapping) {
				const matchResult = await matchAndParseCommand(context.message, config.message)

				if (matchResult == null) return undefined

				const finalContext = {
					...context,
					...matchResult,
				}

				return finalContext
			},
		})

		onOBSWebsocketEvent("VendorEvent", (obs, ev) => {
			if (ev.vendorName == "AdvancedSceneSwitcher" && ev.eventType == "AdvancedSceneSwitcherEvent") {
				const message = ev.eventData.message
				if (message == null || typeof message != "string") return

				advssEvent({
					obs,
					message,
				})
			}
		})
	}
)
