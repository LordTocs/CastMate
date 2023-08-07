import { nanoid } from "nanoid/non-secure"
import { defineStore } from "pinia"
import { type MaybeRefOrGetter, computed, ref, unref, type Component, shallowReactive, toValue, markRaw } from "vue"

export type NamedData = {
	name?: string
} & Record<string | symbol, any>

export interface Document {
	id: string
	type: string
	dirty: boolean
	data: NamedData
	viewData: any
}

export interface DocumentData {
	id: string
}

export interface DocumentDataSelection {
	selectedIds: string[]
}

export const useDocumentStore = defineStore("documents", () => {
	const documents = ref<Map<string, Document>>(new Map())
	const documentComponents = ref<Map<string, Component>>(new Map())

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

	function registerDocumentComponent(type: string, component: Component) {
		documentComponents.value.set(type, markRaw(component))
	}

	return {
		documents,
		documentComponents,
		addDocument,
		registerDocumentComponent,
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

export function useDocument(id: MaybeRefOrGetter<string>) {
	const documentStore = useDocumentStore()

	return computed(() => {
		return documentStore.documents?.get(toValue(id))
	})
}
