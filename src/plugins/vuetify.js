import Vue from 'vue';
import '@mdi/font/css/materialdesignicons.css'
import Vuetify from 'vuetify/lib/framework';

import BitButtonsIcon from '../components/plugins/BitButtonsIcon';

Vue.use(Vuetify);

export default new Vuetify({
	theme: { dark: true },
	icons: {
		values: {
			bitbuttons: {
				component: BitButtonsIcon
			}
		}
	}
});
