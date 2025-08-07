import { computed, App } from "vue"
import {
	ProjectGroup,
	ResourceSchemaEdit,
	getResourceAsProjectGroup,
	handleIpcMessage,
	handleIpcRpc,
	useDataInputStore,
	useDocumentStore,
	useIpcCaller,
	usePluginStore,
	useProjectStore,
	useResourceStore,
} from "castmate-ui-core"
import _cloneDeep from "lodash/cloneDeep"
import OverlayEditorPageVue from "./components/OverlayEditorPage.vue"
import { OverlayEditorView } from "./components/overlay-edit-types"
import { useOverlayRemoteConfigStore } from "./config/overlay-config"
import {
	OverlayBlockStyle,
	OverlayTextAlignment,
	OverlayTextStyle,
	OverlayTransitionAnimation,
	OverlayWidget,
	WidgetBorderRadius,
} from "castmate-plugin-overlays-shared"
import OverlayTextStyleInput from "./components/style/OverlayTextStyleInput.vue"
import OverlayBlockStyleInput from "./components/style/OverlayBlockStyleInput.vue"
import OverlayTextAlignInput from "./components/style/OverlayTextAlignInput.vue"
import OverlayWidgetInput from "./components/OverlayWidgetInput.vue"
import OverlayTransitionAnimationInput from "./components/revealer/OverlayTransitionAnimationInput.vue"
import WidgetBorderRadiusInput from "./components/style/WidgetBorderRadiusInput.vue"

export function initPlugin(app: App<Element>) {
	const dataStore = useDataInputStore()

	dataStore.registerInputComponent(OverlayTextStyle, OverlayTextStyleInput)
	dataStore.registerInputComponent(OverlayBlockStyle, OverlayBlockStyleInput)
	dataStore.registerInputComponent(OverlayTextAlignment, OverlayTextAlignInput)
	dataStore.registerInputComponent(OverlayWidget, OverlayWidgetInput)
	dataStore.registerInputComponent(OverlayTransitionAnimation, OverlayTransitionAnimationInput)
	dataStore.registerInputComponent(WidgetBorderRadius, WidgetBorderRadiusInput)

	const resourceStore = useResourceStore()
	const documentStore = useDocumentStore()

	const configStore = useOverlayRemoteConfigStore()

	documentStore.registerDocumentComponent("overlay", OverlayEditorPageVue)
	documentStore.registerSaveFunction("overlay", async (doc) => {
		const docDataCopy = _cloneDeep(doc.data)
		delete docDataCopy.name
		await resourceStore.applyResourceConfig("Overlay", doc.id, docDataCopy)
	})

	const projectStore = useProjectStore()
	const overlayGroup = getResourceAsProjectGroup(app, {
		resourceType: "Overlay",
		resourceName: "Overlays",
		groupIcon: "mdi mdi-picture-in-picture-top-right",
		documentType: "overlay",
		createView(resource): OverlayEditorView {
			return {
				editView: {
					panState: {
						zoomX: 1,
						zoomY: 1,
						panX: 0,
						panY: 0,
						panning: false,
					},
				},
				obsId: undefined,
			}
		},
	})

	resourceStore.registerConfigSchema("Overlay", {
		type: Object,
		properties: {
			name: { type: String, name: "Overlay Name", required: true, default: "Overlay" },
			size: {
				name: "Size",
				type: Object,
				properties: {
					width: { type: Number, required: true, name: "Width", default: 1920 },
					height: { type: Number, required: true, name: "Height", default: 1080 },
				},
			},
		},
	})

	resourceStore.registerEditComponent("Overlay", ResourceSchemaEdit, async (id, data: any) => {
		await resourceStore.applyResourceConfig("Overlay", id, data)
	})

	resourceStore.registerCreateComponent("Overlay", ResourceSchemaEdit)

	projectStore.registerProjectGroupItem(overlayGroup)

	configStore.initialize()
}
