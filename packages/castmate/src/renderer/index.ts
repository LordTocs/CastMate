import {
	initializeProfiles,
	initializeAutomations,
	useDocumentStore,
	usePluginStore,
	useProjectStore,
	useResourceStore,
	useMediaStore,
	useActionQueueStore,
	useIpcCaller,
	initializeStreamPlans,
	useStreamPlanStore,
	useInitStore,
	useSatelliteConnection,
} from "castmate-ui-core"
import { createApp } from "vue"
import App from "./App.vue"

import PrimeVue from "primevue/config"
import DialogService from "primevue/dialogservice"
import ConfirmationService from "primevue/confirmationservice"

//theme
// import "primevue/resources/themes/lara-dark-blue/theme.css"
import "./theme/castmate/theme.scss"
import "./css/theme-ext.css"
import "./css/spellcast.css"
//core
import "primevue/resources/primevue.min.css"

import "primeicons/primeicons.css"
import "primeflex/primeflex.css"

import "@mdi/font/css/materialdesignicons.css"

import { createPinia } from "pinia"
import ProfileEditorVue from "./components/profiles/ProfileEditor.vue"
import AutomationEditPageVue from "./components/automation/AutomationEditPage.vue"
import { initData, StreamPlanEditorPage } from "castmate-ui-core"

import { initPlugin as initSoundPlugin } from "castmate-plugin-sound-renderer"
import { initPlugin as initVariablesPlugin } from "castmate-plugin-variables-renderer"
import { initPlugin as initTwitchPlugin } from "castmate-plugin-twitch-renderer"
import { initPlugin as initObsPlugin } from "castmate-plugin-obs-renderer"
import { initPlugin as initDiscordPlugin } from "castmate-plugin-discord-renderer"
import { initPlugin as initInputPlugin } from "castmate-plugin-input-renderer"
import { initPlugin as initTimePlugin } from "castmate-plugin-time-renderer"
import { initPlugin as initMinecraftPlugin } from "castmate-plugin-minecraft-renderer"
import { initPlugin as initIoTPlugin } from "castmate-plugin-iot-renderer"
import { initPlugin as initTwinklyPlugin } from "castmate-plugin-twinkly-renderer"
import { initPlugin as initHuePlugin } from "castmate-plugin-philips-hue-renderer"
import { initPlugin as initWyzePlugin } from "castmate-plugin-wyze-renderer"
import { initPlugin as initLifxPlugin } from "castmate-plugin-lifx-renderer"
import { initPlugin as initGoveePlugin } from "castmate-plugin-govee-renderer"
import { initPlugin as initKasaPlugin } from "castmate-plugin-tplink-kasa-renderer"
import { initPlugin as initOsPlugin } from "castmate-plugin-os-renderer"
import { initPlugin as initOverlaysPlugin } from "castmate-plugin-overlays-renderer"
import { initPlugin as initSpellCastPlugin } from "castmate-plugin-spellcast-renderer"

import { initPlugin as initDashboardPlugin } from "castmate-plugin-dashboards-renderer"

import { initPlugin as initRandomPlugin } from "castmate-plugin-random-renderer"

import { initPlugin as initRemotePlugin } from "castmate-plugin-remote-renderer"

import { loadOverlayWidgets } from "castmate-overlay-widget-loader"
import { loadDashboardWidgets } from "castmate-dashboard-widget-loader"

import { useDashboardStore } from "./util/dashboard-store"
import { initializeQueues } from "./util/queues"
import { initSettingsDocuments } from "./components/settings/SettingsTypes"
import Tooltip from "primevue/tooltip"
import { IPCOverlayWidgetDescriptor } from "castmate-plugin-overlays-shared"
import { sendDashboardsToMain, sendOverlaysToMain } from "./util/overlay-util"
import { setupProxyDialogService } from "../../../../libs/castmate-ui-core/src/util/dialog-helper"

/*
const router = createRouter({
	history: createWebHistory(),
	routes: [],
})*/

const pinia = createPinia()
const app = createApp(App)

//DialogService.install?.(app)
console.log("Dialog service inited")
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
const projecStore = useProjectStore()
const documentStore = useDocumentStore()
const resourceStore = useResourceStore()
const actionQueueStore = useActionQueueStore()
const dashboardStore = useDashboardStore()
const mediaStore = useMediaStore()
const planStore = useStreamPlanStore()

const satelliteStore = useSatelliteConnection()

const uiLoadComplete = useIpcCaller("plugins", "uiLoadComplete")

async function init() {
	//Wait for the main process to initialize
	await initStore.initialize()

	await initStore.waitForInitialSetup()

	//Now init all the stores
	await initData()
	await pluginStore.initialize()
	await resourceStore.initialize()
	await projecStore.initialize()

	await initStore.waitForInit()

	await actionQueueStore.initialize()
	await dashboardStore.initialize()
	await planStore.initialize()

	await initializeProfiles(app)
	await initializeAutomations(app)
	await initializeStreamPlans(app)

	documentStore.registerDocumentComponent("profile", ProfileEditorVue)
	documentStore.registerDocumentComponent("automation", AutomationEditPageVue)
	documentStore.registerDocumentComponent("streamplan", StreamPlanEditorPage)

	initSettingsDocuments()

	initializeQueues()

	await initOverlaysPlugin(app)

	await initDashboardPlugin(app)

	await initVariablesPlugin()
	await initTwitchPlugin(app)
	await initSpellCastPlugin(app)

	//TODO: This init function is bonkers, we should formalize initing these plugins after their main process side gets inited.

	await initSoundPlugin(app)
	await initTimePlugin()
	await initObsPlugin()
	await initDiscordPlugin()
	await initInputPlugin()
	await initOsPlugin()
	await initIoTPlugin()
	await initMinecraftPlugin()
	await initTwinklyPlugin()
	await initHuePlugin()
	await initWyzePlugin()
	await initLifxPlugin()
	await initGoveePlugin()
	await initKasaPlugin()
	await initRemotePlugin()

	await initRandomPlugin()

	await mediaStore.initialize()

	await satelliteStore.initialize("castmate")

	loadOverlayWidgets()
	loadDashboardWidgets()

	sendOverlaysToMain()
	sendDashboardsToMain()

	await uiLoadComplete()
}

init()

//TODO: Better Plugin Initialization

app.mount("#app")
