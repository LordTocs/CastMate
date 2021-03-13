import Vue from 'vue'
import App from './App.vue'
import Vuex from "vuex";
import Element from 'element-ui';
import 'element-theme-dark';
import router from './router';
import ipcModule from './store/ipc';

Vue.use(Vuex);
Vue.use(Element, { size: 'small', zIndex: 3000 });
Vue.config.productionTip = false;

const store = new Vuex.Store({
	modules: {
		ipc: ipcModule
	}
});


new Vue({
	router,
	render: h => h(App),
	store
}).$mount('#app')
