import { nanoid } from "nanoid/non-secure"
import { defineStore } from "pinia"
import { type MaybeRef, computed, ref, unref, type Component } from "vue"

type DataWithName = {
	name?: string
} & Record<string | symbol, any>

export interface Document {
	id: string
	type: string
	dirty: boolean
	data: DataWithName
}

export const useDocumentStore = defineStore("documents", () => {
	const documents = ref<Map<string, Document>>(new Map())
	const documentComponents = ref<Map<string, Component>>(new Map())

	function addDocument(data: DataWithName, type: string) {
		const id = nanoid()

		documents.value.set(id, {
			id,
			type,
			dirty: false,
			data,
		})

		const document = documents.value.get(id)
		if (!document) throw Error("How did we get here?")
		return document
	}

	function registerDocumentComponent(type: string, component: Component) {
		documentComponents.value.set(type, component)
	}

	return {
		documents,
		documentComponents,
		addDocument,
		registerDocumentComponent,
	}
})

export function useDocumentComponent(type: MaybeRef<string | undefined>) {
	const documentStore = useDocumentStore()

	return computed(() => {
		const typeActual = unref(type)
		if (!typeActual) {
			return undefined
		}
		return documentStore.documentComponents?.get(typeActual)
	})
}

export function useDocument(id: MaybeRef<string>) {
	const documentStore = useDocumentStore()

	return computed(() => {
		return documentStore.documents?.get(unref(id))
	})
}
