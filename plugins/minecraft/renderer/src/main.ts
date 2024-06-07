import { useResourceStore, ResourceSettingList, ResourceSchemaEdit } from "castmate-ui-core"

export function initPlugin() {
	const resourceStore = useResourceStore()

	resourceStore.registerSettingComponent("RCONConnection", ResourceSettingList)
	resourceStore.registerEditComponent("RCONConnection", ResourceSchemaEdit)
	resourceStore.registerCreateComponent("RCONConnection", ResourceSchemaEdit)

	resourceStore.registerConfigSchema("RCONConnection", {
		type: Object,
		properties: {
			name: { type: String, name: "Server Name", required: true },
			host: { type: String, name: "Hostname", required: true, default: "127.0.0.1" },
			port: { type: Number, name: "Port", required: true, default: 25575 },
			password: { type: String, name: "Password" },
		},
	})
}
