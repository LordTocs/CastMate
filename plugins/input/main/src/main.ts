import { defineAction, defineTrigger, onLoad, onUnload, definePlugin } from "castmate-core"

import { setupKeyboard } from "./keyboard"

export default definePlugin(
	{
		id: "input",
		name: "Input",
		description: "Input!",
		icon: "mdi mdi-keyboard",
		color: "#826262",
	},
	() => {
		setupKeyboard()
	}
)
