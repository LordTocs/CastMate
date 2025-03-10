import { createApp } from "vue"
import App from "./App.vue"

import PrimeVue from "primevue/config"
import DialogService from "primevue/dialogservice"
import ConfirmationService from "primevue/confirmationservice"

import {
	initData,
	useInitStore,
	usePluginStore,
	useResourceStore,
	useSatelliteConnection,
	useSatelliteMedia,
	useSatelliteResourceStore,
} from "castmate-ui-core"

import "./theme/castmate/theme.scss"
import "./css/theme-ext.css"
import "./css/spellcast.css"

import "primevue/resources/primevue.min.css"

import "primeicons/primeicons.css"
import "primeflex/primeflex.css"

import "@mdi/font/css/materialdesignicons.css"

import Tooltip from "primevue/tooltip"

import { createPinia } from "pinia"

import { setupProxyDialogService } from "castmate-ui-core"

import { loadDashboardWidgets } from "castmate-dashboard-widget-loader"

import { initSatellitePlugin as initSoundPlugin } from "castmate-plugin-sound-renderer"
import { initPlugin as initIoTPlugin } from "castmate-plugin-iot-renderer"
import { initPlugin as initTwinklyPlugin } from "castmate-plugin-twinkly-renderer"
import { initPlugin as initHuePlugin } from "castmate-plugin-philips-hue-renderer"
import { initPlugin as initWyzePlugin } from "castmate-plugin-wyze-renderer"
import { initPlugin as initLifxPlugin } from "castmate-plugin-lifx-renderer"
import { initPlugin as initGoveePlugin } from "castmate-plugin-govee-renderer"
import { initPlugin as initKasaPlugin } from "castmate-plugin-tplink-kasa-renderer"

//import { initPlugin as initTwitchPlugin } from "castmate-plugin-twitch-renderer"

const pinia = createPinia()
const app = createApp(App)

//DialogService.install?.(app)
app.use(PrimeVue)
//app.use(DialogService)
setupProxyDialogService(app)

app.use(ConfirmationService)

app.directive("tooltip", Tooltip)
//app.use(Maska)

//app.use(router)
app.use(pinia)

const initStore = useInitStore()
const pluginStore = usePluginStore()
const resourceStore = useResourceStore()

const satelliteStore = useSatelliteConnection()
const satelliteResources = useSatelliteResourceStore()
const satelliteMedia = useSatelliteMedia()

async function init() {
	await initStore.initialize("satellite")

	await initStore.waitForInitialSetup()

	await initData()

	await pluginStore.initialize()
	await resourceStore.initialize()

	await initStore.waitForInit()

	await initSoundPlugin()
	await initIoTPlugin()
	await initTwinklyPlugin()
	await initHuePlugin()
	await initWyzePlugin()
	await initLifxPlugin()
	await initGoveePlugin()
	await initKasaPlugin()

	await satelliteStore.initialize()
	await satelliteResources.initialize()
	await satelliteMedia.initialize()

	loadDashboardWidgets()
}

init()

app.mount("#app")
