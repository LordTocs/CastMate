import {
	initializeProfiles,
	useDocumentStore,
	usePluginStore,
	useProjectStore,
	useResourceStore,
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

usePluginStore().initialize()
useResourceStore().initialize()
useProjectStore()
	.initialize()
	.then(() => {
		initializeProfiles(app)
	})
useDocumentStore().registerDocumentComponent("profile", ProfileEditorVue)
initData()

//TODO: Better Plugin Initialization
initSoundPlugin()

app.mount("#app")
