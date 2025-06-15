import { DashboardPluginOptions, DashboardWidgetComponent } from "castmate-dashboard-core"
import dashboardPlugin from "castmate-plugin-dashboards-dashboard"
import remotePlugin from "castmate-plugin-remote-dashboard"

import { defineStore } from "pinia"
import { ref, computed, markRaw, MaybeRefOrGetter, toValue } from "vue"

export interface DashboardWidgetInfo {
	plugin: string
	component: DashboardWidgetComponent
}

export const useDashboardWidgets = defineStore("castmate-dashboard-widgets", () => {
	const widgets = ref(new Map<string, DashboardWidgetInfo>())

	function loadPluginWidgets(opts: DashboardPluginOptions) {
		for (const widget of opts.widgets) {
			widgets.value.set(`${opts.id}.${widget.widget.id}`, { plugin: opts.id, component: markRaw(widget) })

			console.log("Loading Dashboard Widget", opts.id, widget.widget.id, widget.widget.name)
		}
	}

	function getWidget(plugin: string, widget: string) {
		return widgets.value.get(`${plugin}.${widget}`)
	}

	return { loadPluginWidgets, getWidget, widgets: computed<DashboardWidgetInfo[]>(() => [...widgets.value.values()]) }
})

export function useDashboardWidget(config: MaybeRefOrGetter<{ plugin: string; widget: string }>) {
	const widgetStore = useDashboardWidgets()

	return computed<DashboardWidgetComponent | undefined>(() => {
		const resolved = toValue(config)
		return widgetStore.getWidget(resolved.plugin, resolved.widget)?.component
	})
}

export function loadDashboardWidgets() {
	const widgets = useDashboardWidgets()

	widgets.loadPluginWidgets(dashboardPlugin)
	widgets.loadPluginWidgets(remotePlugin)
}
