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
	await initStore.initialize()

	await initStore.waitForInitialSetup()

	await initData()

	await pluginStore.initialize()
	await resourceStore.initialize()

	await initStore.waitForInit()

	await initSoundPlugin()

	await satelliteStore.initialize("satellite")
	await satelliteResources.initialize()
	await satelliteMedia.initialize("satellite")

	loadDashboardWidgets()
}

init()

app.mount("#app")
