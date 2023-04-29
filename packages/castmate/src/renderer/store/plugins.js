import { ipcRenderer } from "electron"
import { defineStore } from "pinia"
import { computed, ref } from "vue"
import { useIpc } from "../utils/ipcMap"

const castmateIcon =
	"svg: M 10.449219 4.9765625 C 10.382886 4.974817 10.313909 4.9809525 10.246094 4.9941406 C 9.9474223 5.0523233 9.7116396 5.2489365 9.5898438 5.5039062 C 9.5076121 5.6763857 9.4782725 5.8744717 9.5175781 6.0761719 C 9.5928281 6.4627638 9.8997199 6.7466752 10.265625 6.8105469 L 10.597656 7.8769531 C 8.8912215 8.2283768 7.2856319 8.8009252 5.8046875 9.5585938 C 5.1747625 9.8807968 4.5672367 10.236455 3.984375 10.623047 C 3.939122 11.16531 3.9516916 11.720743 4.0253906 12.279297 C 4.0305606 12.318597 4.0350676 12.356917 4.0410156 12.396484 C 4.0585996 12.515694 4.0782895 12.634437 4.1015625 12.753906 C 4.3637727 14.099608 4.9601389 15.296226 5.7871094 16.273438 C 7.5413833 18.346553 10.334621 19.435133 13.189453 18.878906 C 16.044286 18.322679 18.226819 16.26524 19.074219 13.685547 C 19.47374 12.46914 19.576663 11.136718 19.314453 9.7910156 C 19.297643 9.7038706 19.279676 9.617619 19.259766 9.53125 C 19.252566 9.499961 19.244088 9.4668359 19.236328 9.4355469 C 19.112723 8.927159 18.940675 8.4425963 18.726562 7.984375 C 18.045177 7.8237907 17.352721 7.7012292 16.650391 7.6171875 C 14.814402 7.3979033 12.915661 7.4474044 11.003906 7.7988281 L 10.912109 6.6835938 C 11.227589 6.4870655 11.405328 6.1092481 11.330078 5.7226562 C 11.285342 5.4935455 11.159726 5.3023199 10.988281 5.1699219 C 10.836231 5.0523928 10.648216 4.9817989 10.449219 4.9765625 z M 15.25 8.9785156 C 16.004566 8.9997196 16.750381 9.0678341 17.486328 9.1777344 C 17.549678 9.3530583 17.606457 9.5312448 17.654297 9.7148438 C 17.686877 9.8405184 17.715144 9.9683613 17.740234 10.097656 C 18.01227 11.495852 17.787828 12.874857 17.189453 14.052734 C 16.361448 15.683143 14.817065 16.927923 12.882812 17.304688 C 10.948561 17.681453 9.0514522 17.106883 7.671875 15.90625 C 6.675011 15.039198 5.9480764 13.844944 5.6757812 12.447266 C 5.650698 12.317971 5.6300897 12.189324 5.6132812 12.060547 C 5.5814747 11.815145 5.5648273 11.570423 5.5625 11.328125 C 6.0623543 11.051692 6.5761352 10.798361 7.1054688 10.566406 C 7.3868145 11.737043 8.5446303 12.48859 9.7382812 12.255859 L 13.445312 11.533203 C 14.638704 11.300731 15.428686 10.169064 15.25 8.9785156 z M 19.617188 9.4980469 C 19.634248 9.5738137 19.649583 9.6481822 19.664062 9.7226562 C 19.915671 11.01483 19.84968 12.352859 19.472656 13.605469 C 20.360913 13.385926 20.930781 12.505565 20.753906 11.597656 L 20.544922 10.53125 C 20.483636 10.217839 20.319499 9.9513807 20.09375 9.7597656 C 19.954629 9.64159 19.79277 9.5523509 19.617188 9.4980469 z M 14.162109 12.029297 C 14.10557 12.028178 14.04877 12.033916 13.992188 12.044922 C 13.388639 12.162581 13.031769 12.947149 13.197266 13.796875 C 13.362764 14.646602 13.986295 15.238493 14.589844 15.121094 C 15.193393 15.003694 15.54831 14.220821 15.382812 13.371094 C 15.232831 12.60103 14.708653 12.040113 14.162109 12.029297 z M 3.7109375 12.595703 C 3.3377919 12.901097 3.1417114 13.396025 3.2402344 13.902344 L 3.4472656 14.970703 C 3.6241411 15.878613 4.4830901 16.479679 5.3886719 16.349609 C 4.5689417 15.329989 4.0035611 14.11444 3.7519531 12.822266 C 3.7372141 12.747016 3.7233495 12.671723 3.7109375 12.595703 z M 10.052734 12.830078 C 9.9961954 12.828963 9.9393952 12.834697 9.8828125 12.845703 C 9.2792637 12.963361 8.9243461 13.745976 9.0898438 14.595703 C 9.2553413 15.445429 9.8788726 16.039533 10.482422 15.921875 C 11.08597 15.804475 11.440888 15.021601 11.275391 14.171875 C 11.125408 13.401576 10.599278 12.840857 10.052734 12.830078 z"

const builtInPlugin = {
	name: "castmate",
	uiName: "CastMate",
	color: "#8DC1C0",
	icon: castmateIcon,
	actions: {
		delay: {
			name: "Delay",
			color: "#8DC1C0",
			icon: "mdi-timer-sand",
			data: {
				type: "Number",
				required: true,
				unit: { name: "Seconds", short: "s" },
				template: true,
			},
			description: "Puts a delay after the current action",
		},
		timestamp: {
			name: "Timestamp",
			color: "#8DC1C0",
			icon: "mdi-clock-outline",
			data: {
				type: "Number",
				required: true,
				unit: { name: "Seconds", short: "s" },
			},
			description:
				"Delays execution of this action until a certain time after the start of this action list.",
		},
		automation: {
			name: "Automation",
			color: "#8DC1C0",
			icon: "mdi-cog",
			data: {
				type: "Object",
				properties: {
					automation: { type: "Automation", required: true },
				},
			},
			description: "Runs another automation inside this one.",
		},
	},
	settings: {
		port: { type: "Number", default: 80, name: "Internal Webserver Port" },
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
		console.log("Initing Plugin Store")
		plugins.value = { castmate: builtInPlugin, ...(await getPlugins()) }

		rootState.value = await getRootState()

		//TODO: Do invidiual updates so we don't cause an invalidation on the WHOLE thing
		ipcRenderer.removeAllListeners("state_update")
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

		ipcRenderer.removeAllListeners("state_removal")
		ipcRenderer.on("state_removal", (event, removal) => {
			for (let pluginKey in removal) {
				if (!rootState.value[pluginKey]) continue

				delete rootState.value[pluginKey][removal[pluginKey]]

				if (Object.keys(rootState.value[pluginKey]) == 0) {
					delete rootState.value[pluginKey]
				}
			}
		})

		//TODO: Put this somewhere cooler
		ipcRenderer.removeAllListeners("play-sound")
		ipcRenderer.on("play-sound", (event, arg) => {
			console.log("Playing", arg.source)
			let audio = new Audio(`file://${arg.source}`)
			audio.volume = arg.volume
			audio.addEventListener(
				"canplaythrough",
				(event) => {
					audio.play()
				},
				{ once: true }
			)
			event.returnValue = true
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
