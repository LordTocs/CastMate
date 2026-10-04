import { DataEditUser, ProjectTreeNode, ViewData } from "castmate-schema"
import { defineStore } from "pinia"
import { type MaybeRefOrGetter, computed, ref, type Component, toValue, markRaw } from "vue"
import { useToast } from "primevue/usetoast"
import { useBaseDataBinding } from "./data-binding"

export function useDocumentComponent(
	plugin: MaybeRefOrGetter<string | undefined>,
	type: MaybeRefOrGetter<string | undefined>
) {
	const documentStore = useDocumentStore()

	return computed(() => {
		const pluginValue = toValue(plugin)
		const typeValue = toValue(type)

		if (!typeValue) return undefined
		if (!pluginValue) return undefined

		return documentStore.getDocumentEditorComponent(pluginValue, typeValue)
	})
}

export function useDocument(id: MaybeRefOrGetter<string | undefined>) {
	const documentStore = useDocumentStore()

	return computed(() => {
		const idValue = toValue(id)
		if (!idValue) return undefined
		return documentStore.openDocuments.get(idValue)
	})
}

export function useDocumentSelection() {
	const dataBinding = useBaseDataBinding()
	return dataBinding.editor.editingUsers.get("local")
}

export interface DocumentInfo {
	plugin: string
	type: string
	id: string
	path: string
}

export interface OpenDocumentEditor {
	plugin: string
	type: string
	id: string
	dirty: boolean
	documentData: object
	viewData: ViewData
	editorStates: Map<string, DataEditUser>
}

export const useDocumentStore = defineStore("documents2", () => {
	const items = ref<DocumentInfo[]>([])
	const tree = ref<ProjectTreeNode[]>([])

	const documentEditorComponents = ref<Map<string, Component>>(new Map())

	const openDocumentEditors = ref<Map<string, OpenDocumentEditor>>(new Map())

	function registerDocumentEditorComponent(plugin: string, type: string, editor: Component) {
		documentEditorComponents.value.set(`${plugin}_${type}`, markRaw(editor))
	}

	function getDocumentEditorComponent(plugin: string, type: string): Component | undefined {
		return documentEditorComponents.value.get(`${plugin}_${type}`)
	}

	async function openDocument(id: string) {
		const existing = openDocumentEditors.value.get(id)
		if (existing != null) {
			return existing
		}

		const newEditor: OpenDocumentEditor = {
			plugin: "",
			type: "",
			id: id,
			dirty: false,
			documentData: {},
			viewData: {
				data: {},
				subPaths: {},
			},
			editorStates: new Map(),
		}

		newEditor.editorStates.set("local", {
			focusPath: "",
			selection: { type: "range", startIndex: 0, length: 0 },
		})

		openDocumentEditors.value.set(id, newEditor)

		return newEditor
	}

	return {
		items: computed(() => items.value),
		tree: computed(() => tree.value),
		openDocuments: openDocumentEditors,
		openDocument,
		registerDocumentEditorComponent,
		getDocumentEditorComponent,
	}
})
