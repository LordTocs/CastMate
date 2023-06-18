import { type Component } from "vue"

export interface DockedTab {
	id: string
	component: Component
	document: any
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
