import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { store } from './store/store'
import vuetify from './plugins/vuetify'

//import VueMask from 'v-mask'

console.log("Hello from the renderer");

const app = createApp(App);

app.use(vuetify);

app.use(router);
app.use(store);

//Vue.config.productionTip = false;

app.mount("#app");
