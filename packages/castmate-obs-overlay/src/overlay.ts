import { createApp } from "vue"
import Overlay from "./loader/Overlay.vue"
import { createPinia } from "pinia"

const pinia = createPinia()
const app = createApp(Overlay)

app.use(pinia)

app.mount("#overlay")
