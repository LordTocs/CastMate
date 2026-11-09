import { createDataEditor, DataEditor, DataEditUser, joinDataPath, ProjectTreeNode, ViewData } from "castmate-schema"
import { defineStore } from "pinia"
import { type MaybeRefOrGetter, computed, ref, type Component, toValue, markRaw } from "vue"
import { useToast } from "primevue/usetoast"
import { useBaseDataBinding, useDataPath } from "../editor/data-binding"
import { useDataEditor, useLocalDataEditUser } from "../main"
import { nanoid } from "nanoid"

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

export function useDocumentSelection(localPath?: MaybeRefOrGetter<string | undefined>) {
	const dataBinding = useBaseDataBinding()
	const dataPath = useDataPath()
	const user = useLocalDataEditUser()

	function getSelectionPath() {
		const basePath = toValue(dataPath)
		return joinDataPath(basePath, toValue(localPath))
	}

	return computed<string[]>({
		get() {
			const selectionPath = getSelectionPath()
			if (!selectionPath) return []
			if (user.value.selection?.type != "list") {
				return []
			}

			return user.value.selection.ids
		},
		set(v) {
			const selectionPath = getSelectionPath()

			if (!selectionPath) return

			user.value.selection = {
				type: "list",
				ids: v,
			}
		},
	})
}

export function useIsSelected(id: MaybeRefOrGetter<string>, localPath?: MaybeRefOrGetter<string | undefined>) {
	const editor = useDataEditor()
	const path = useDataPath()

	return computed(() => {
		const selectionPath = joinDataPath(toValue(path), toValue(localPath))
		const selectionId = toValue(id)
		const user = editor.value.editingUsers.get("local")

		if (!selectionPath) return false
		if (!user) return false
		if (user.selection?.type != "list") return false
		if (user.focusPath != selectionPath) return false

		return user.selection.ids.includes(selectionId)
	})
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
	editor: DataEditor
}

export const useDocumentStore = defineStore("documents2", () => {
	const items = ref<DocumentInfo[]>([])
	const tree = ref<ProjectTreeNode[]>([
		{
			name: "Folder",
			items: [
				{ plugin: "test", type: "test", id: nanoid(), name: "Test File" },
				{ plugin: "test", type: "test2", id: nanoid(), name: "Test2 File" },
				{
					name: "Inner Folder",
					items: [
						{ plugin: "test", type: "test", id: nanoid(), name: "Test3 File" },
						{ plugin: "test", type: "test2", id: nanoid(), name: "Test4 File" },
					],
				},
			],
		},
		{ plugin: "test", type: "test", id: nanoid(), name: "Test5 File" },
	])

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
			editor: createDataEditor(),
		}

		newEditor.editor.editingUsers.set("local", {
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
