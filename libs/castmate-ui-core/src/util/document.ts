import { nanoid } from "nanoid/non-secure"
import { defineStore } from "pinia"
import {
	type MaybeRefOrGetter,
	computed,
	ref,
	unref,
	type Component,
	shallowReactive,
	toValue,
	markRaw,
	provide,
	inject,
	WritableComputedRef,
	ComputedRef,
} from "vue"

export type NamedData = {
	name?: string
} & Record<string | symbol, any>

export type Selection = string[]

export interface DocumentSelection {
	items: Selection
	container: string
}

export type ViewData = {
	selection: DocumentSelection
} & Record<string | symbol, any>

export interface Document {
	id: string
	type: string
	dirty: boolean
	data: NamedData
	viewData: ViewData
}

export interface DocumentData {
	id: string
}

type DocumentSaveFunction = (doc: Document) => any

export const useDocumentStore = defineStore("documents", () => {
	const documents = ref<Map<string, Document>>(new Map())
	const documentComponents = ref<Map<string, Component>>(new Map())
	const saveFunctions = ref<Map<string, DocumentSaveFunction>>(new Map())

	function addDocument(id: string, data: NamedData, view: any, type: string) {
		if (documents.value.has(id)) {
			throw new Error("Document ID already in use")
		}

		documents.value.set(id, {
			id,
			type,
			dirty: false,
			data,
			viewData: view,
		})

		const document = documents.value.get(id)
		if (!document) throw Error("How did we get here?")
		return document
	}

	function removeDocument(id: string) {
		documents.value.delete(id)
	}

	function registerDocumentComponent(type: string, component: Component) {
		documentComponents.value.set(type, markRaw(component))
	}

	function registerSaveFunction(type: string, save: DocumentSaveFunction) {
		saveFunctions.value.set(type, save)
	}

	async function saveDocument(id: string) {
		const doc = documents.value.get(id)
		if (!doc) return

		const save = saveFunctions.value.get(doc.type)
		if (!save) return

		if (!doc.dirty) return

		await save(doc)
		doc.dirty = false
	}

	return {
		documents,
		documentComponents,
		addDocument,
		registerDocumentComponent,
		registerSaveFunction,
		saveDocument,
		removeDocument,
	}
})

export function useDocumentComponent(type: MaybeRefOrGetter<string | undefined>) {
	const documentStore = useDocumentStore()

	return computed(() => {
		const typeActual = toValue(type)
		if (!typeActual) {
			return undefined
		}
		return documentStore.documentComponents?.get(typeActual)
	})
}

export function useDocument(id: MaybeRefOrGetter<string | undefined>) {
	const documentStore = useDocumentStore()

	return computed(() => {
		const idValue = toValue(id)
		if (!idValue) return undefined
		return documentStore.documents?.get(idValue)
	})
}

export function useDocumentId() {
	return inject<ComputedRef<string>>(
		"documentId",
		computed(() => "")
	)
}

export function provideDocument(id: MaybeRefOrGetter<string>) {
	const documentStore = useDocumentStore()

	provide(
		"documentId",
		computed(() => toValue(id))
	)

	provide(
		"documentSelection",
		computed({
			get() {
				return documentStore.documents.get(toValue(id))?.viewData.selection
			},
			set(v) {
				const doc = documentStore.documents.get(toValue(id))
				if (doc && v) {
					doc.viewData.selection = v
				}
			},
		})
	)
}

export function useSetDocumentSelection() {
	const selection = inject<WritableComputedRef<DocumentSelection>>("documentSelection")

	return function (newSelection: DocumentSelection) {
		if (!selection) return
		selection.value = newSelection
	}
}

export function useIsSelected(path: MaybeRefOrGetter<string | undefined>, id: MaybeRefOrGetter<string>) {
	const selection = inject<WritableComputedRef<DocumentSelection>>("documentSelection")

	return computed(() => {
		const selectionPath = toValue(path)
		const selectionId = toValue(id)

		if (!selectionPath) return false
		if (!selection || !selection.value) return false
		if (selection.value.container != selectionPath) return false

		return selection.value.items.includes(selectionId)
	})
}

export function useDocumentSelection(path: MaybeRefOrGetter<string | undefined>) {
	const selection = inject<WritableComputedRef<DocumentSelection>>("documentSelection")

	return computed({
		get() {
			const selectionPath = toValue(path)

			if (!selectionPath) return []
			if (!selection || !selection.value) return []

			if (selection.value.container != selectionPath) {
				return []
			}

			return selection.value.items
		},
		set(v) {
			const selectionPath = toValue(path)

			if (!selectionPath) return
			if (!selection) return

			selection.value = {
				container: selectionPath,
				items: v,
			}
		},
	})
}

export function useDocumentPath() {
	const parentPath = inject<ComputedRef<string>>(
		"documentObjectPath",
		computed(() => "")
	)

	return computed<string>(() => parentPath?.value ?? "")
}

export function joinDocumentPath(...paths: (string | undefined)[]) {
	let result = ""
	for (const path of paths) {
		if (!path) {
			continue
		}
		if (result.length > 0) {
			const separator = path.startsWith("[") ? "" : "."
			result += separator
		}
		result += path
	}

	return result
}

export function provideDocumentPath(localPath: MaybeRefOrGetter<string | undefined>) {
	const parentPath = inject<ComputedRef<string>>(
		"documentObjectPath",
		computed(() => "")
	)

	const ourPath = computed(() => {
		const actualLocalPath = toValue(localPath)
		return joinDocumentPath(parentPath.value, actualLocalPath)
	})

	provide("documentObjectPath", ourPath)

	return ourPath
}
