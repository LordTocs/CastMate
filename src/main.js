import Vue from 'vue'
import App from './App.vue'
import router from './router';
import { store } from './store/store';
import vuetify from './plugins/vuetify';
import { VTimeline } from "vuetify/lib";

Vue.config.productionTip = false;

Vue.component('v-timeline', VTimeline);

new Vue({
    router,
    render: h => h(App),
    vuetify,
    store
}).$mount('#app')
