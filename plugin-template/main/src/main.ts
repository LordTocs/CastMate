import { defineAction, defineTrigger, onLoad, onUnload, definePlugin } from "castmate-core"

export default definePlugin(
	{
		id: "{{name}}",
		name: "UI Name",
		description: "UI Description",
		icon: "mdi-pencil",
	},
	() => {
		//Plugin Intiialization
	}
)
