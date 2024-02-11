import { useDataInputStore } from "castmate-ui-core"
import { Timer } from "castmate-plugin-time-shared"
import TimerViewVue from "./components/TimerView.vue"

export async function initPlugin() {
	const inputStore = useDataInputStore()
	inputStore.registerViewComponent(Timer, TimerViewVue)
}
