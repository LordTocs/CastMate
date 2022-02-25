import Vue from 'vue'
import App from './App.vue'
import router from './router';
import { store } from './store/store';
import vuetify from './plugins/vuetify';
import { VTimeline } from "vuetify/lib";
import VueMask from 'v-mask'

Vue.config.productionTip = false;

Vue.component('v-timeline', VTimeline);
Vue.use(VueMask)

new Vue({
    router,
    render: h => h(App),
    vuetify,
    store
}).$mount('#app')
