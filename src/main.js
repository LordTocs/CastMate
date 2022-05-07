import Vue from 'vue'
import App from './App.vue'
import router from './router';
import { store } from './store/store';
import vuetify from './plugins/vuetify';
import { VTimeline } from "vuetify/lib";
import VueMask from 'v-mask'
import VueMixpanel from 'vue-mixpanel';

Vue.config.productionTip = false;


Vue.use(VueMixpanel, {
    token: process.env.VUE_APP_MIXPANEL_PROJECT_TOKEN,
    debug: (process.env.NODE_ENV !== 'production' && !process.env.DEV_ANALYTICS)
});



Vue.component('v-timeline', VTimeline);
Vue.use(VueMask)

console.log("Main!");

new Vue({
    router,
    render: h => h(App),
    vuetify,
    store
}).$mount('#app')
