import { OverlayPluginOptions, OverlayWidgetComponent } from "castmate-overlay-core"
import overlaysPlugin from "castmate-plugin-overlays-overlays"
import { defineStore } from "pinia"
import { ref, Component, computed } from "vue"

export interface OverlayWidgetInfo {
	plugin: string
	component: OverlayWidgetComponent
}

export const useOverlayWidgets = defineStore("castmate-overlay-widgets", () => {
	const widgets = ref(new Map<string, OverlayWidgetInfo>())

	function loadPluginWidgets(opts: OverlayPluginOptions) {
		for (const widget of opts.widgets) {
			widgets.value.set(`${opts.id}.${widget.widget.id}`, { plugin: opts.id, component: widget })

			console.log("Loading Overlay Widget", opts.id, widget.widget.id, widget.widget.name)
		}
	}

	return { loadPluginWidgets, widgets: computed<OverlayWidgetInfo[]>(() => [...widgets.value.values()]) }
})

export function loadOverlayWidgets() {
	const widgets = useOverlayWidgets()

	widgets.loadPluginWidgets(overlaysPlugin)
}
