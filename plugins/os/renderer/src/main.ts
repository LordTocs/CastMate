import { PowerShellCommand } from "castmate-plugin-os-shared"
import { useDataInputStore } from "castmate-ui-core"
import PowerShellCommandInput from "./components/PowerShellCommandInput.vue"

export function initPlugin() {
	const dataStore = useDataInputStore()

	dataStore.registerInputComponent(PowerShellCommand, PowerShellCommandInput)
}
