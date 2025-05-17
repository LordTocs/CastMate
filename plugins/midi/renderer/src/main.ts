import { MidiMessage, MidiPortConfig, MidiPortState } from "castmate-plugin-midi-shared"
import { ResourceData } from "castmate-schema"
import {
	useResourceStore,
	ResourceSettingList,
	ResourceSchemaEdit,
	ProjectItem,
	useDockingStore,
	useDocumentStore,
	useResourceArray,
	getResourceAsProjectGroup,
	useProjectStore,
	useDataInputStore,
} from "castmate-ui-core"
import { App, computed } from "vue"
import { MidiPageData } from "./midi-device-page-types"
import _cloneDeep from "lodash/cloneDeep"
import MidiInputPage from "./components/MidiInputPage.vue"
import MidiOutputPage from "./components/MidiOutputPage.vue"
import MidiMessageInput from "./components/input/MidiMessageInput.vue"

export function initPlugin(app: App<Element>) {
	const resourceStore = useResourceStore()
	const documentStore = useDocumentStore()
	const projectStore = useProjectStore()
	const inputStore = useDataInputStore()

	inputStore.registerInputComponent(MidiMessage, MidiMessageInput)

	documentStore.registerDocumentComponent("midi-input", MidiInputPage)
	documentStore.registerDocumentComponent("midi-output", MidiOutputPage)

	documentStore.registerSaveFunction("midi-input", async (doc) => {
		const dataCopy = _cloneDeep(doc.data)
		await resourceStore.setResourceConfig("MidiInput", doc.id, dataCopy)
	})

	documentStore.registerSaveFunction("midi-output", async (doc) => {
		const dataCopy = _cloneDeep(doc.data)
		await resourceStore.setResourceConfig("MidiOutput", doc.id, dataCopy)
	})

	const inputGroup = getResourceAsProjectGroup(app, {
		resourceType: "MidiInput",
		resourceName: "Midi Inputs",
		groupIcon: "mdi mdi-midi",
		documentType: "midi-input",
		createView(resource) {
			return {}
		},
	})

	const outputGroup = getResourceAsProjectGroup(app, {
		resourceType: "MidiOutput",
		resourceName: "Midi Outputs",
		groupIcon: "mdi mdi-midi",
		documentType: "midi-output",
		createView(resource) {
			return {}
		},
	})

	projectStore.registerProjectGroupItem(
		computed(() => ({
			id: "midi",
			title: "Midi",
			icon: "mdi mdi-midi",
			items: [inputGroup.value, outputGroup.value],
		}))
	)
}
