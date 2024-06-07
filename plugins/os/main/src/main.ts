import { defineAction, defineTrigger, onLoad, onUnload, definePlugin } from "castmate-core"
import { setupPowershell } from "./powershell"
import { setupProcesses } from "./processes"
export default definePlugin(
	{
		id: "os",
		name: "OS",
		description: "Operating System",
		icon: "mdi mdi-laptop",
		color: "#CC9B78",
	},
	() => {
		//Plugin Intiialization
		setupPowershell()
		setupProcesses()
	}
)
