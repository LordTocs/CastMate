import { useResourceStore, ResourceSettingList, ResourceSchemaEdit, useDataInputStore } from "castmate-ui-core"
import "./css/icons.css"
import { OBSSourceTransform } from "castmate-plugin-obs-shared"

export { default as DashboardObsCard } from "./components/DashboardObsCard.vue"

import ObsTransformInputVue from "./components/transform/ObsTransformInput.vue"

export function initPlugin() {
	const resourceStore = useResourceStore()

	resourceStore.registerSettingComponent("OBSConnection", ResourceSettingList)
	resourceStore.registerEditComponent("OBSConnection", ResourceSchemaEdit)
	resourceStore.registerCreateComponent("OBSConnection", ResourceSchemaEdit)

	resourceStore.registerConfigSchema("OBSConnection", {
		type: Object,
		properties: {
			name: { type: String, name: "Connection Name", required: true },
			host: { type: String, name: "Hostname", required: true, default: "127.0.0.1" },
			port: { type: Number, name: "Port", required: true, default: 4455 },
			password: { type: String, name: "Password" },
		},
	})

	const dataStore = useDataInputStore()

	dataStore.registerInputComponent(OBSSourceTransform, ObsTransformInputVue)
}
