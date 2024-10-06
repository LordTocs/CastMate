import { createApp } from "vue"
import App from "./App.vue"

import PrimeVue from "primevue/config"
import DialogService from "primevue/dialogservice"
import ConfirmationService from "primevue/confirmationservice"

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

app.mount("#app")
