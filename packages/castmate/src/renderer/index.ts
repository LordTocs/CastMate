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

const router = createRouter({
	history: createWebHistory(),
	routes: [],
})

const pinia = createPinia()
const app = createApp(App)

app.use(PrimeVue)
app.use(DialogService)
app.use(ConfirmationService)
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

	initializeProfiles(app)
	useDocumentStore().registerDocumentComponent("profile", ProfileEditorVue)

	useMediaStore().initialize()
	initData()
	initSoundPlugin()
}

init()

//TODO: Better Plugin Initialization

app.mount("#app")
