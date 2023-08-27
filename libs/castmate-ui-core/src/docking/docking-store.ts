import { NamedData, useDocumentStore } from "./../util/document"
import { defineStore } from "pinia"
import { ref, computed, type Component, markRaw } from "vue"

import { DockedArea, DockedFrame, DockedSplit } from "../main"
import { nanoid } from "nanoid/non-secure"

function focusDocumentId(division: DockedFrame | DockedSplit, documentId: string) {
	if (division.type == "frame") {
		for (let tab of division.tabs) {
			if (tab.documentId == documentId) {
				//Focus the tab
				//TODO: Actually focus the HTML element??
				division.currentTab = tab.id
				return true
			}
		}
		return false
	} else {
		for (let div of division.divisions) {
			if (focusDocumentId(div, documentId)) {
				return true
			}
		}
		return false
	}
}

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

	function openDocument(documentId: string, data: NamedData, view: object, documentType: string) {
		//Check to see if there's a tab already open with this document id
		if (focusDocumentId(dockedInfo.value, documentId)) {
			return
		}

		//Document is not yet open... OPEN ONE
		const doc = documentStore.addDocument(documentId, data, view, documentType)

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

		const newTabId = nanoid()
		targetFrame.tabs.push({
			id: newTabId,
			documentId: doc.id,
		})
		targetFrame.currentTab = newTabId
	}

	function openPage(id: string, title: string, page: Component) {
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

		targetFrame.tabs.push({
			id,
			title,
			page: markRaw(page),
		})
		targetFrame.currentTab = id
	}

	return { rootDockArea: dockedInfo, openDocument, openPage }
})
