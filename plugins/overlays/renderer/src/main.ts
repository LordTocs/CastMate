import { computed, App } from "vue"
import {
	ProjectGroup,
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
import { OverlayBlockStyle, OverlayTextAlignment, OverlayTextStyle } from "castmate-plugin-overlays-shared"
import OverlayTextStyleInput from "./components/style/OverlayTextStyleInput.vue"
import OverlayBlockStyleInput from "./components/style/OverlayBlockStyleInput.vue"
import OverlayTextAlignInput from "./components/style/OverlayTextAlignInput.vue"

export function initPlugin(app: App<Element>) {
	const dataStore = useDataInputStore()

	dataStore.registerInputComponent(OverlayTextStyle, OverlayTextStyleInput)
	dataStore.registerInputComponent(OverlayBlockStyle, OverlayBlockStyleInput)
	dataStore.registerInputComponent(OverlayTextAlignment, OverlayTextAlignInput)

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
				showPreview: false,
			}
		},
	})

	projectStore.registerProjectGroupItem(overlayGroup)

	configStore.initialize()
}
