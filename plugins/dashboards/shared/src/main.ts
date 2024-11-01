import { IPCSchema, SchemaObj } from "castmate-schema"

export interface DashboardWidgetSize {
	width: number
	height: number
}

export interface DashboardWidget {
	id: string
	plugin: string
	widget: string
	size: DashboardWidgetSize
	config: Object
}

export interface DashboardWidgetOptions<PropSchema extends SchemaObj = SchemaObj> {
	id: string
	name: string
	description?: string
	icon?: string
	defaultSize: {
		width: number
		height: number
	}
	config: PropSchema
}

export interface IPCDashboardWidgetDescriptor {
	plugin: string
	options: {
		id: string
		name: string
		description?: string
		icon?: string
		defaultSize: {
			width: number
			height: number
		}
		config: IPCSchema
	}
}

export interface DashboardWidgetDescriptor {
	plugin: string
	options: DashboardWidgetOptions
}

export interface DashboardSection {
	id: string
	name: string
	columns: number
	widgets: DashboardWidget[]
}

export interface DashboardPage {
	id: string
	name: string
	sections: DashboardSection[]
}

export interface DashboardConfig {
	name: string
	pages: DashboardPage[]
	remoteTwitchIds: string[]
	cloudId?: string
}

export interface InitialDashboardConfig {
	name: string
}
