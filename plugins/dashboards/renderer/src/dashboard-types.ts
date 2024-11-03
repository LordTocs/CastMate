export interface DashboardWidgetView {
	id: string
}

export interface DashboardSectionView {
	id: string
	widgets: DashboardWidgetView[]
}

export interface DashboardPageView {
	id: string
	sections: DashboardSectionView[]
}

export interface DashboardResourceSlotView {
	id: string
}

export interface DashboardView {
	scrollX: number
	scrollY: number
	pages: DashboardPageView[]
	slots: DashboardResourceSlotView[]
}
