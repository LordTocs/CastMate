import { ipcRenderer } from "electron";
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { useIpc } from "../utils/ipcMap"


export const usePluginStore = defineStore("plugins", () => {

    const plugins = ref({})

    const rootState = ref({})

    const getPlugins = useIpc("core", "getPlugins");
    const getRootState = useIpc("state", "getRootState");

    async function init() {
        plugins.value = await getPlugins();

        rootState.value = await getRootState();

        //TODO: Do invidiual updates so we don't cause an invalidation on the WHOLE thing
        ipcRenderer.on('state_update', (event, stateUpdate) => {
            for (let pluginKey in stateUpdate) {
				if (!rootState.value[pluginKey]) {
					rootState.value[pluginKey] = {};
				}
				for (let stateKey in stateUpdate[pluginKey]) {
					rootState.value[pluginKey][stateKey] = stateUpdate[pluginKey][stateKey];
				}
			}
        });

        ipcRenderer.on('state_removal', (event, removal) => {
            for (let pluginKey in removal) {
				if (!rootState.value[pluginKey])
					continue;

				delete rootState.value[pluginKey][removal[pluginKey]];

				if (Object.keys(rootState.value[pluginKey]) == 0) {
					delete rootState.value[pluginKey];
				}
			}
        })
    }

    const pluginList = computed(() => Object.keys(plugins.value).map(key => plugins.value[key]))

    return { 
        init, 
        plugins: computed(() => plugins.value), 
        pluginList,
        rootState: computed(() => rootState.value), 
        rootStateSchemas: computed(() => {
            const result = {};

			for (let plugin of pluginList.value) {
				result[plugin.name] = plugin.stateSchemas;
			}

			return result;
        })
    }
})