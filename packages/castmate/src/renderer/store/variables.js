import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { useIpc } from '../utils/ipcMap';
import { ipcRenderer } from 'electron';

export const useVariableStore = defineStore("variables", () => {

	const variableSpecs = ref({})

	const getVariableSpecs = useIpc("variables", "getVariableSpecs")

	async function init() {
		variableSpecs.value = await getVariableSpecs();

		ipcRenderer.on('variables_updateSpecs', (event, specs) => {
			variableSpecs.value = specs
		})
	}

	return { init, variableSpecs: computed(() => variableSpecs.value)}
})
