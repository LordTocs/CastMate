import Vue from 'vue';
import '@mdi/font/css/materialdesignicons.css'
import Vuetify from 'vuetify/lib/framework';

import SpellCastIcon from '../components/plugins/SpellCastIcon';

Vue.use(Vuetify);

export default new Vuetify({
	theme: { dark: true },
	icons: {
		values: {
			spellcast: {
				component: SpellCastIcon
			}
		}
	}
});
