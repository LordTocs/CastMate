import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { store } from './store/store'
import vuetify from './plugins/vuetify'

const app = createApp(App);

app.use(vuetify);

app.use(router);
app.use(store);

app.mount("#app");
