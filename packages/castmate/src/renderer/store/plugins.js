import { ipcRenderer } from "electron"
import { defineStore } from "pinia"
import { computed, ref } from "vue"
import { useIpc } from "../utils/ipcMap"



const builtInPlugin = {
	name: 'castmate',
	uiName: 'CastMate',
	color: '#8DC1C0',
	icon: 'mdi-alpha-c-box',
	actions: {
		delay: {
			name: "Delay",
			color: '#8DC1C0',
			icon: "mdi-timer-sand",
			data: { type: "Number", required: true, unit: { name: "Seconds", short: "s" }, },
			description: "Puts a delay after the current action",
		},
		timestamp: {
			name: "Timestamp",
			color: '#8DC1C0',
			icon: "mdi-clock-outline",
			data: { type: "Number", required: true, unit: { name: "Seconds", short: "s" }, },
			description: "Delays execution of this action until a certain time after the start of this action list."
		},
		automation: {
			name: "Automation",
			color: '#8DC1C0',
			icon: "mdi-cog",
			data: {
				type: "Object",
				properties: {
					automation: { type: "Automation", required: true },
				},
			},
			description: "Runs another automation inside this one."
		},
	},
	settings: {
		port: { type: "Number", default: 80, name: "Internal Webserver Port" }
	},
	secrets: {},
	triggers: {},
	stateSchemas: {},
	ipcMethods: [],
}

export const usePluginStore = defineStore("plugins", () => {
	const plugins = ref({})

	const rootState = ref({})

	const getPlugins = useIpc("core", "getPlugins")
	const getRootState = useIpc("state", "getRootState")

	async function init() {
		plugins.value = await getPlugins()
		plugins.value['castmate'] = builtInPlugin

		rootState.value = await getRootState()

		//TODO: Do invidiual updates so we don't cause an invalidation on the WHOLE thing
		ipcRenderer.on("state_update", (event, stateUpdate) => {
			for (let pluginKey in stateUpdate) {
				if (!rootState.value[pluginKey]) {
					rootState.value[pluginKey] = {}
				}
				for (let stateKey in stateUpdate[pluginKey]) {
					rootState.value[pluginKey][stateKey] =
						stateUpdate[pluginKey][stateKey]
				}
			}
		})

		ipcRenderer.on("state_removal", (event, removal) => {
			for (let pluginKey in removal) {
				if (!rootState.value[pluginKey]) continue

				delete rootState.value[pluginKey][removal[pluginKey]]

				if (Object.keys(rootState.value[pluginKey]) == 0) {
					delete rootState.value[pluginKey]
				}
			}
		})
	}

	const pluginList = computed(() =>
		Object.keys(plugins.value).map((key) => plugins.value[key])
	)

	return {
		init,
		plugins: computed(() => plugins.value),
		pluginList,
		rootState: computed(() => rootState.value),
		rootStateSchemas: computed(() => {
			const result = {}

			for (let plugin of pluginList.value) {
				result[plugin.name] = plugin.stateSchemas
			}

			return result
		}),
	}
})
