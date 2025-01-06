import { nanoid } from "nanoid/non-secure"
import { inject, type Component } from "vue"
import { useDocumentStore } from "./document"
import { useDockingStore, iterTabs } from "../main"

export type DocumentBase = {
	name: string
} & Record<string, any>

export interface DockedTab {
	id: string
	documentId?: string
	page?: Component
	title?: string
	pageData?: any
}

export interface DockedFrame {
	id: string
	type: "frame"
	currentTab: string
	tabs: Array<DockedTab>
}

export interface DockedSplit {
	id: string
	type: "split"
	direction: "horizontal" | "vertical"
	divisions: Array<DockedFrame | DockedSplit>
	dividers: Array<number>
}

export interface DockedArea extends DockedSplit {
	dragging: boolean
	focusedFrame: string | undefined
}

export function useTabFrame() {
	const tabFrame = inject<DockedFrame | undefined>("docking-frame", undefined)
	if (!tabFrame) {
		throw new Error("useTabFrame can only be used in a child component of DockingFrame")
	}
	return tabFrame
}

export function useDockingArea() {
	const dockingArea = inject<DockedArea | undefined>("docking-area", undefined)
	if (!dockingArea) {
		throw new Error("useTabFrame can only be used in a child component of DockingFrame")
	}
	return dockingArea
}

export function useSelectTab() {
	const tabFrame = useTabFrame()
	const dockingArea = useDockingArea()
	return function (tabId: string) {
		tabFrame.currentTab = tabId
		dockingArea.focusedFrame = tabFrame.id
	}
}

export function useFocusThisTab() {
	const tabFrame = inject<DockedFrame | undefined>("docking-frame", undefined)
	const dockingArea = inject<DockedArea | undefined>("docking-area", undefined)

	return function () {
		if (tabFrame && dockingArea) {
			dockingArea.focusedFrame = tabFrame.id
		}
	}
}

export function useSaveActiveTab() {
	const dockingStore = useDockingStore()
	const documentStore = useDocumentStore()

	return () => {
		const tab = dockingStore.getActiveTab()

		if (!tab) return
		if (!tab.documentId) return

		documentStore.saveDocument(tab.documentId)
	}
}

export function useSaveAllTabs() {
	const dockingStore = useDockingStore()
	const documentStore = useDocumentStore()

	return () => {
		for (const t of iterTabs(dockingStore.rootDockArea)) {
			if (!t.documentId) continue
			documentStore.saveDocument(t.documentId)
		}
	}
}

export function findAndRemoveTab(division: DockedSplit | DockedFrame, tabId: string): DockedTab | undefined {
	if (division.type === "frame") {
		const idx = division.tabs.findIndex((t) => t.id == tabId)
		if (idx >= 0) {
			const [tab] = division.tabs.splice(idx, 1)
			if (division.currentTab == tab.id) {
				console.log("Finding New Tab to focus")
				let nextTab = division.tabs[idx]
				if (!nextTab) {
					nextTab = division.tabs[division.tabs.length - 1]
				}
				console.log("Next Tab", nextTab?.id)
				division.currentTab = nextTab?.id ?? ""
				console.log(division)
			}
			return tab
		}
	} else if (division.type === "split") {
		for (let i = 0; i < division.divisions.length; ++i) {
			const d = division.divisions[i]

			const tab = findAndRemoveTab(d, tabId)

			if (tab) {
				if (d.type == "frame") {
					if (d.tabs.length == 0) {
						division.divisions.splice(i, 1)
					}
				} else if (d.type == "split") {
					if (d.divisions.length == 1) {
						division.divisions[i] = d.divisions[0]
					}
				}
				return tab
			}
		}
	}
	return undefined
}

function findParentSplit(division: DockedSplit, frameId: string): DockedSplit | undefined {
	for (let i = 0; i < division.divisions.length; ++i) {
		const d = division.divisions[i]
		if (d.type === "frame") {
			if (d.id == frameId) {
				return division
			}
		} else {
			const s = findParentSplit(d, frameId)
			if (s) {
				return s
			}
		}
	}
	return undefined
}

export type DropMode = "all" | "left" | "top" | "bottom" | "right"

export function useMoveToFrame() {
	const tabFrame = useTabFrame()
	const dockingArea = useDockingArea()

	return function (tabId: string, drop: DropMode = "all") {
		const tab = findAndRemoveTab(dockingArea, tabId)
		if (tab) {
			if (drop === "all") {
				tabFrame.tabs.push(tab)
				tabFrame.currentTab = tab.id
			} else {
				const split = findParentSplit(dockingArea, tabFrame.id)
				if (!split) {
					throw new Error("WHAT HOW?")
				}

				const newFrame: DockedFrame = {
					type: "frame",
					id: nanoid(),
					currentTab: tab.id,
					tabs: [tab],
				}

				const relativeIdx = split.divisions.findIndex((d) => d.id == tabFrame.id)
				const idxOffset = drop === "left" || drop === "top" ? 0 : 1
				const dropDirection = drop === "left" || drop == "right" ? "horizontal" : "vertical"

				if (split.direction == dropDirection) {
					console.log("Dropping in split")
					const insertIdx = relativeIdx + idxOffset
					split.divisions.splice(insertIdx, 0, newFrame)
				} else {
					console.log("Creating new split", dropDirection)
					const newSplit: DockedSplit = {
						type: "split",
						id: nanoid(),
						direction: dropDirection,
						dividers: [],
						divisions: [split.divisions[relativeIdx]],
					}
					newSplit.divisions.splice(idxOffset, 0, newFrame)
					split.divisions[relativeIdx] = newSplit
				}
			}
		}
	}
}

type InsertSide = "left" | "right"

export function useInsertToFrame() {
	const tabFrame = useTabFrame()
	const dockingArea = useDockingArea()

	return function (tabId: string, relativeId: string, side: InsertSide) {
		const tab = findAndRemoveTab(dockingArea, tabId)

		if (tab) {
			const idx = tabFrame.tabs.findIndex((t) => t.id == relativeId)
			if (idx >= 0) {
				console.log("Insert", side)
				if (side == "left") {
					tabFrame.tabs.splice(idx, 0, tab)
				} else {
					tabFrame.tabs.splice(idx + 1, 0, tab)
				}
			}
		}
	}
}

export function useCloseTab() {
	const dockingArea = useDockingArea()
	const documentStore = useDocumentStore()

	return function (tabId: string) {
		const tab = findAndRemoveTab(dockingArea, tabId)
		if (tab?.documentId) {
			documentStore.removeDocument(tab.documentId)
		}
	}
}
