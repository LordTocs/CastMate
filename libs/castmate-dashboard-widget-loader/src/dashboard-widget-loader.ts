import { DashboardPluginOptions, DashboardWidgetComponent } from "castmate-dashboard-core"
import dashboardPlugin from "castmate-plugin-dashboards-dashboard"

import { defineStore } from "pinia"
import { ref, computed, markRaw } from "vue"

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

export function loadDashboardWidgets() {
	const widgets = useDashboardWidgets()

	widgets.loadPluginWidgets(dashboardPlugin)
}
