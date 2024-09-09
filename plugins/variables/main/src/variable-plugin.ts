import { definePlugin, usePluginLogger } from "castmate-core"
import { setupVariableActions } from "./actions"
import { setupViewerVariables } from "./viewer-variables"

export default definePlugin(
	{
		id: "variables",
		name: "Variables",
		icon: "mdi mdi-variable",
		color: "#D3934A",
	},
	() => {
		setupVariableActions()
		setupViewerVariables()
	}
)
