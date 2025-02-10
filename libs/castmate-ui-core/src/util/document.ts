import { getByPath } from "castmate-schema"
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
	Directive,
	Ref,
	onMounted,
	onBeforeUnmount,
	onUnmounted,
} from "vue"
import { createDataBinding, DataBinding, DataPathView, joinDataPath, useDataPath } from "./data-binding"

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

export interface DocumentView extends DataBinding {
	selection: DocumentSelection
}

function createDocumentView(rootData: any): DocumentView {
	const result = createDataBinding(rootData) as DocumentView
	result.selection = { items: [], container: "" }
	return result
}

export interface Document {
	id: string
	type: string
	dirty: boolean
	data: NamedData
	viewData: ViewData
	view: DocumentView
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
			view: createDocumentView(data),
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
				return (
					documentStore.documents.get(toValue(id))?.viewData.selection ?? {
						items: [],
						container: "",
					}
				)
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

export function useRawDocumentSelection() {
	return inject<WritableComputedRef<DocumentSelection>>(
		"documentSelection",
		computed({
			get() {
				return {
					items: [],
					container: "",
				}
			},
			set(v) {},
		})
	)
}

export function useIsSelected(id: MaybeRefOrGetter<string>, localPath?: MaybeRefOrGetter<string | undefined>) {
	const selection = useRawDocumentSelection()
	const path = useDataPath()

	return computed(() => {
		const selectionPath = joinDataPath(toValue(path), toValue(localPath))
		const selectionId = toValue(id)

		if (!selectionPath) return false
		if (!selection || !selection.value) return false
		if (selection.value.container != selectionPath) return false

		return selection.value.items.includes(selectionId)
	})
}

export function useDocumentSelection(localPath?: MaybeRefOrGetter<string | undefined>) {
	const selection = useRawDocumentSelection()
	const path = useDataPath()

	function getSelectionPath() {
		const rootPath = toValue(path)
		return joinDataPath(rootPath, toValue(localPath))
	}

	return computed({
		get() {
			const selectionPath = getSelectionPath()

			if (!selectionPath) return []
			if (!selection || !selection.value) return []

			if (selection.value.container != selectionPath) {
				return []
			}

			return selection.value.items
		},
		set(v) {
			const selectionPath = getSelectionPath()

			if (!selectionPath) return
			if (!selection) return

			selection.value = {
				container: selectionPath,
				items: v,
			}
		},
	})
}

/*
export function viewRef<T>(key: PropertyKey, initialValue: T): Ref<T> {
	const documentView = useDocumentView()

	const fallback = ref(initialValue)

	onMounted(() => {
		if (documentView.value) {
			if (!(key in documentView.value.data)) {
				documentView.value.data[key] = initialValue
			}
		}
	})

	onUnmounted(() => {
		if (documentView.value) {
			if (key in documentView.value.data) {
				delete documentView.value.data[key]
			}
		}
	})

	return computed<T>({
		get() {
			if (documentView.value) {
				return documentView.value.data[key]
			}
			return fallback.value
		},
		set(v) {
			if (documentView.value) {
				documentView.value.data[key] = v
			}
			fallback.value = v
		},
	})
}

export const vPathFocus: Directive = {
	mounted(el, binding, vnode) {
		const documentView = useDocumentView()
		if (documentView.value && binding.instance && "focus" in binding.instance) {
			documentView.value.focusable = binding.instance as DocumentFocusable
		}
	},
	beforeUnmount(el, binding, vnode) {
		const documentView = useDocumentView()
	},
}
*/
