import { KeyboardKey, KeyCombo } from "castmate-plugin-input-shared"
import { useDataInputStore } from "castmate-ui-core"
import KeyboardKeyInputVue from "./components/KeyboardKeyInput.vue"
import KeyComboInputVue from "./components/KeyComboInput.vue"

export function initPlugin() {
	const inputStore = useDataInputStore()

	inputStore.registerInputComponent(KeyboardKey, KeyboardKeyInputVue)
	inputStore.registerInputComponent(KeyCombo, KeyComboInputVue)
}
