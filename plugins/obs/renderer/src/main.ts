import { useResourceStore, ResourceSettingList, ResourceSchemaEdit } from "castmate-ui-core"
import "./css/icons.css"

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
}
