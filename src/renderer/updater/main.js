import Vue from 'vue'
import Updater from './Updater.vue';
import vuetify from '../plugins/vuetify';

Vue.config.productionTip = false;

console.log("Updater!");

new Vue({
    render: h => h(Updater),
    vuetify,
}).$mount('#app')
