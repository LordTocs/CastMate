import { computed, App } from "vue"
import {
	ProjectGroup,
	getResourceAsProjectGroup,
	handleIpcMessage,
	handleIpcRpc,
	useDocumentStore,
	useIpcCaller,
	usePluginStore,
	useProjectStore,
	useResourceStore,
} from "castmate-ui-core"
import _cloneDeep from "lodash/cloneDeep"
import OverlayEditorPageVue from "./components/OverlayEditorPage.vue"
import { OverlayEditorView } from "./components/overlay-edit-types"

export function initPlugin(app: App<Element>) {
	//Init Renderer Module

	const resourceStore = useResourceStore()
	const documentStore = useDocumentStore()

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
}
