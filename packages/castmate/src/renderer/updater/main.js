import { createApp } from 'vue'
import Updater from './Updater.vue';
import vuetify from '../plugins/vuetify'

const app = createApp(Updater);
app.use(vuetify);
app.mount("#app");
