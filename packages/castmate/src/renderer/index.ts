import { useDocumentStore, usePluginStore, useResourceStore } from "castmate-ui-core"
import { createApp } from "vue"
import App from "./App.vue"

import PrimeVue from "primevue/config"

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

const pinia = createPinia()
const app = createApp(App)

app.use(PrimeVue)

//app.use(Maska)

//app.use(router)
app.use(pinia)

usePluginStore().initialize()
useResourceStore().initialize()
useDocumentStore().registerDocumentComponent("profile", ProfileEditorVue)

initData()

app.mount("#app")
