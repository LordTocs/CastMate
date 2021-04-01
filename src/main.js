import Vue from 'vue'
import App from './App.vue'
import Element from 'element-ui';
//import 'element-theme-dark';
import 'element-theme-chalk';
import router from './router';
import { store } from './store/store'

Vue.use(Element, { size: 'small', zIndex: 3000 });
Vue.config.productionTip = false;




new Vue({
	router,
	render: h => h(App),
	store
}).$mount('#app')
