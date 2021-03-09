import Vue from 'vue'
import App from './App.vue'
import Element from 'element-ui';
import 'element-theme-dark';
import router from './router';
// const customTitlebar = require('custom-electron-titlebar');

// new customTitlebar.Titlebar({
// 	backgroundColor: customTitlebar.Color.fromHex('#444')
// });

Vue.use(Element, { size: 'small', zIndex: 3000 });
Vue.config.productionTip = false;

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
