import { createApp } from "vue"
import App from "./App.vue"

import PrimeVue from "primevue/config"

//theme
import "primevue/resources/themes/lara-dark-blue/theme.css"
//core
import "primevue/resources/primevue.min.css"

import { createPinia } from "pinia"

const pinia = createPinia()
const app = createApp(App)

app.use(PrimeVue)

//app.use(Maska)

//app.use(router)
app.use(pinia)

app.mount("#app")
