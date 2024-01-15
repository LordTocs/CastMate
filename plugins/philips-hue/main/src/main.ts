import https from "https"
import axios from "axios"
import {
	defineAction,
	defineTrigger,
	onLoad,
	onUnload,
	definePlugin,
	defineSetting,
	autoRerun,
	onSettingChanged,
	defineSecret,
	AsyncCache,
} from "castmate-core"
import { PhilipsHUEGroup, PhilipsHUELight, setupResources } from "./resources"
import { setupDiscovery } from "./discovery"
import { setupHueEvents } from "./events"
import { defineSettingComponent } from "castmate-core/src/plugins/plugin"
import { LightResource } from "castmate-plugin-iot-main"
import { HUEScene } from "./api"

export default definePlugin(
	{
		id: "philips-hue",
		name: "Philips HUE",
		icon: "iot iot-hue-sultan",
		color: "#7F743F",
	},
	() => {
		defineSettingComponent("hubSearch")

		const hubIp = defineSetting("hubIp", {
			type: String,
			name: "Hue Hub IP",
		})

		const hubKey = defineSecret("hubKey", {
			type: String,
			name: "Hue Hub Key",
		})

		setupResources(hubIp, hubKey)
		setupDiscovery(hubIp, hubKey)
		setupHueEvents(hubIp, hubKey)

		const sceneCache = new AsyncCache<HUEScene[]>(async () => {
			if (!hubIp.value || !hubKey.value) return []

			const resp = await axios.request({
				baseURL: `https://${hubIp.value}/clip/v2`,
				headers: {
					"hue-application-key": hubKey.value,
				},
				httpsAgent: new https.Agent({
					rejectUnauthorized: false,
				}),
				url: "/resource/scene",
				method: "get",
			})

			return resp.data.data
		})

		defineAction({
			id: "scene",
			name: "Set HUE Scene",
			icon: "mdi mdi-lightbulb-group-outline",
			config: {
				type: Object,
				properties: {
					group: {
						type: LightResource,
						name: "Group",
						filter: { provider: "philips-hue", hueType: "group" },
						required: true,
					},
					scene: {
						type: String,
						name: "Scene",
						required: true,
						async enum(context: { group: PhilipsHUEGroup }) {
							const scenes = await sceneCache.get()
							if (!scenes) return []

							const roomScenes = scenes.filter((s) => s.group.rid == context.group.config.roomId)

							return roomScenes.map((s) => ({
								name: s.metadata.name,
								value: s.id,
							}))
						},
					},
				},
			},
			async invoke(config, contextData, abortSignal) {
				const group = config.group as PhilipsHUEGroup
				if (!group) return

				if (!hubIp.value || !hubKey.value) return

				await axios.request({
					baseURL: `https://${hubIp.value}/clip/v2`,
					headers: {
						"hue-application-key": hubKey.value,
					},
					httpsAgent: new https.Agent({
						rejectUnauthorized: false,
					}),
					url: `/resource/scene/${config.scene}`,
					method: "put",
					data: {
						recall: {
							action: "active",
						},
					},
				})
			},
		})
	}
)
