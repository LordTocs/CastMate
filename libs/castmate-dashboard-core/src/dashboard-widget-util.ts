import { RemoteTemplateResolutionContext, SchemaObj, resolveRemoteTemplateSchema } from "castmate-schema"
import {
	Component,
	ComputedRef,
	MaybeRefOrGetter,
	Ref,
	VueElement,
	VueElementConstructor,
	computed,
	ref,
	toValue,
} from "vue"
import { DashboardWidgetOptions } from "castmate-plugin-dashboards-shared"

export function declareWidgetOptions<PropSchema extends SchemaObj>(opts: DashboardWidgetOptions<PropSchema>) {
	return opts
}

export type DashboardWidgetComponent = Component & { widget: DashboardWidgetOptions }

export interface DashboardPluginOptions {
	id: string
	widgets: DashboardWidgetComponent[]
}

export function definePluginDashboard(opts: { id: string; widgets: Component[] }) {
	return opts as DashboardPluginOptions
}
