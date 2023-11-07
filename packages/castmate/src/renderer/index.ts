import {
	initializeProfiles,
	useDocumentStore,
	usePluginStore,
	useProjectStore,
	useResourceStore,
	useMediaStore,
	useActionQueueStore,
} from "castmate-ui-core"
import { createApp } from "vue"
import App from "./App.vue"

import PrimeVue from "primevue/config"
import DialogService from "primevue/dialogservice"
import ConfirmationService from "primevue/confirmationservice"

//theme
// import "primevue/resources/themes/lara-dark-blue/theme.css"
import "./css/theme.css"
import "./css/spellcast.css"
//core
import "primevue/resources/primevue.min.css"

import "primeicons/primeicons.css"
import "primeflex/primeflex.css"

import "@mdi/font/css/materialdesignicons.css"

import { createPinia } from "pinia"
import ProfileEditorVue from "./components/profiles/ProfileEditor.vue"
import { initData } from "castmate-ui-core"
import { createRouter, createWebHistory } from "vue-router"

import { initPlugin as initSoundPlugin } from "castmate-plugin-sound-renderer"
import { initPlugin as initTwitchPlugin } from "castmate-plugin-twitch-renderer"
import { initPlugin as initObsPlugin } from "castmate-plugin-obs-renderer"
import { initPlugin as initDiscordPlugin } from "castmate-plugin-discord-renderer"
import { initPlugin as initInputPlugin } from "castmate-plugin-input-renderer"
import { initPlugin as initMinecraftPlugin } from "castmate-plugin-minecraft-renderer"
import { initPlugin as initIoTPlugin } from "castmate-plugin-iot-renderer"
import { initPlugin as initTwinklyPlugin } from "castmate-plugin-twinkly-renderer"
import { initPlugin as initHuePlugin } from "castmate-plugin-philips-hue-renderer"
import { initPlugin as initWyzePlugin } from "castmate-plugin-wyze-renderer"
import { useDashboardStore } from "./util/dashboard-store"
import { initializeQueues } from "./util/queues"
import { initSettingsDocuments } from "./components/settings/SettingsTypes"
import Tooltip from "primevue/tooltip"

const router = createRouter({
	history: createWebHistory(),
	routes: [],
})

const pinia = createPinia()
const app = createApp(App)

app.use(PrimeVue)
app.use(DialogService)
app.use(ConfirmationService)

app.directive("tooltip", Tooltip)
//app.use(Maska)

app.use(router)
app.use(pinia)

async function init() {
	await Promise.all([
		usePluginStore().initialize(),
		useResourceStore().initialize(),
		useProjectStore().initialize(),
		useActionQueueStore().initialize(),
	])

	await useDashboardStore().initialize()

	initializeProfiles(app)

	const documentStore = useDocumentStore()
	documentStore.registerDocumentComponent("profile", ProfileEditorVue)
	initSettingsDocuments()

	initializeQueues()

	useMediaStore().initialize()
	initData()
	initSoundPlugin()
	initTwitchPlugin()
	initObsPlugin()
	initDiscordPlugin()
	initInputPlugin()
	initIoTPlugin()
	initMinecraftPlugin()
	initTwinklyPlugin()
	initHuePlugin()
	initWyzePlugin()
}

init()

//TODO: Better Plugin Initialization

app.mount("#app")
