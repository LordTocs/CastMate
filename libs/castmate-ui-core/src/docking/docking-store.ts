import { NamedData, useDocumentStore } from "./../util/document"
import { defineStore } from "pinia"
import { ref, computed, type Component, markRaw, MaybeRefOrGetter, toValue, reactive } from "vue"

import { DockedArea, DockedFrame, DockedSplit, findAndRemoveTab, DockedTab } from "../main"
import { nanoid } from "nanoid/non-secure"
import _cloneDeep from "lodash/cloneDeep"
import DocumentPage from "../components/document/DocumentPage.vue"

function focusTabId(division: DockedFrame | DockedSplit, tabId: string) {
	if (division.type == "frame") {
		for (let tab of division.tabs) {
			if (tab.id == tabId) {
				//Focus the tab
				//TODO: Actually focus the HTML element??
				division.currentTab = tab.id
				return true
			}
		}
		return false
	} else {
		for (let div of division.divisions) {
			if (focusTabId(div, tabId)) {
				return true
			}
		}
		return false
	}
}

function findFrame(division: DockedFrame | DockedSplit, frameId: string | undefined): DockedFrame | undefined {
	if (!frameId) return undefined

	if (division.type == "frame") {
		if (division.id == frameId) {
			return division
		}
		return undefined
	} else {
		for (let div of division.divisions) {
			const frame = findFrame(div, frameId)
			if (frame) {
				return frame
			}
		}
		return undefined
	}
}

function findTabId(division: DockedSplit | DockedFrame, predicate: (tab: DockedTab) => boolean): DockedTab | undefined {
	if (division.type == "frame") {
		for (const tab of division.tabs) {
			if (predicate(tab)) {
				return tab
			}
		}
	} else {
		for (const div of division.divisions) {
			const result = findTabId(div, predicate)
			if (result) {
				return result
			}
		}
		return undefined
	}
}

function findFirstFrame(division: DockedFrame | DockedSplit): DockedFrame | undefined {
	if (division.type == "frame") {
		return division
	} else {
		for (let div of division.divisions) {
			const frame = findFirstFrame(div)
			if (frame) {
				return frame
			}
		}
		return undefined
	}
}

export function* iterTabs(division: DockedFrame | DockedSplit): Generator<DockedTab> {
	if (division.type == "frame") {
		for (const t of division.tabs) {
			yield t
		}
	} else {
		for (const div of division.divisions) {
			for (const t of iterTabs(div)) {
				yield t
			}
		}
	}
}

export const useDockingStore = defineStore("docking", () => {
	const documentStore = useDocumentStore()

	const dockedInfo = ref<DockedArea>({
		id: "root",
		type: "split",
		direction: "horizontal",
		dividers: [],
		divisions: [],
		dragging: false,
		focusedFrame: undefined,
	})

	//Todo: Serialize to file for loading back the editor configuration.

	function closeTab(tabId: string) {
		findAndRemoveTab(dockedInfo.value, tabId)
	}

	function closeDocument(documentId: string) {
		const tabId = getDocumentTabId(documentId)
		if (tabId) {
			closeTab(tabId)
		}
	}

	function getDocumentTabId(documentId: string) {
		return findTabId(dockedInfo.value, (tab) => tab.pageData?.documentId == documentId)?.id
	}

	function openDocument(
		documentId: string,
		data: NamedData,
		view: object,
		documentType: string,
		icon: MaybeRefOrGetter<string | Component>
	) {
		const idStr = `${documentType}.${documentId}`

		//Check to see if there's a tab already open with this document id
		if (focusTabId(dockedInfo.value, idStr)) {
			return
		}

		//Document is not yet open... OPEN ONE
		const doc = documentStore.addDocument(documentId, _cloneDeep(data), view, documentType)

		openPage(
			idStr,
			() => doc.data.name ?? documentId,
			icon,
			DocumentPage,
			() => {
				return {
					documentId,
					documentType,
					dirty: doc.dirty,
				}
			}
		)
	}

	function openPage(
		id: string,
		title: MaybeRefOrGetter<string>,
		icon: MaybeRefOrGetter<Component | string>,
		page: Component,
		pageData?: MaybeRefOrGetter<object>
	) {
		if (focusTabId(dockedInfo.value, id)) {
			return
		}

		let targetFrame = findFrame(dockedInfo.value, dockedInfo.value.focusedFrame)

		if (!targetFrame) {
			targetFrame = findFirstFrame(dockedInfo.value)
		}

		if (!targetFrame) {
			//For whatever reason we don't have a frame, so make one!
			targetFrame = {
				id: nanoid(),
				type: "frame",
				currentTab: "",
				tabs: [],
			}

			dockedInfo.value.divisions.push(targetFrame)
		}

		const iconComputed = computed(() => {
			const iconValue = toValue(icon)
			if (typeof iconValue == "string") {
				return iconValue
			}
			return markRaw(iconValue)
		})

		targetFrame.tabs.push(
			reactive({
				id,
				title: computed(() => toValue(title)),
				icon: iconComputed,
				page: markRaw(page),
				pageData: computed(() => toValue(pageData)),
			})
		)
		targetFrame.currentTab = id
	}

	function getActiveTab() {
		const frame = findFrame(dockedInfo.value, dockedInfo.value.focusedFrame)
		if (!frame) return

		const tab = frame.tabs.find((t) => t.id == frame.currentTab)
		if (!tab) return

		return tab
	}

	return { rootDockArea: dockedInfo, openDocument, openPage, closeTab, closeDocument, getDocumentTabId, getActiveTab }
})
