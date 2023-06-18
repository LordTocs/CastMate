import { createApp } from "vue"
import App from "./App.vue"
import router from "./router"
import vuetify from "./plugins/vuetify"
import { createPinia } from "pinia"

import Maska from "maska"

const pinia = createPinia()
const app = createApp(App)

app.use(vuetify)
app.use(Maska)

app.use(router)
app.use(pinia)

app.mount("#app")
