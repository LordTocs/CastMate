import { OverlayPluginOptions, OverlayWidgetComponent } from "castmate-overlay-core"
import overlaysPlugin from "castmate-plugin-overlays-overlays"
import randomPlugin from "castmate-plugin-random-overlays"
import twitchPlugin from "castmate-plugin-twitch-overlays"
import { defineStore } from "pinia"
import { ref, Component, computed, markRaw, MaybeRefOrGetter, toValue } from "vue"

export interface OverlayWidgetInfo {
	plugin: string
	component: OverlayWidgetComponent
}

export const useOverlayWidgets = defineStore("castmate-overlay-widgets", () => {
	const widgets = ref(new Map<string, OverlayWidgetInfo>())

	function loadPluginWidgets(opts: OverlayPluginOptions) {
		for (const widget of opts.widgets) {
			widgets.value.set(`${opts.id}.${widget.widget.id}`, { plugin: opts.id, component: markRaw(widget) })

			console.log("Loading Overlay Widget", opts.id, widget.widget.id, widget.widget.name)
		}
	}

	function getWidget(plugin: string, widget: string) {
		return widgets.value.get(`${plugin}.${widget}`)
	}

	return { loadPluginWidgets, getWidget, widgets: computed<OverlayWidgetInfo[]>(() => [...widgets.value.values()]) }
})

export function loadOverlayWidgets() {
	const widgets = useOverlayWidgets()

	widgets.loadPluginWidgets(overlaysPlugin)
	widgets.loadPluginWidgets(randomPlugin)
	widgets.loadPluginWidgets(twitchPlugin)
}

export function useOverlayWidget(config: MaybeRefOrGetter<{ plugin: string; widget: string }>) {
	const widgetStore = useOverlayWidgets()

	return computed<OverlayWidgetComponent | undefined>(() => {
		const resolved = toValue(config)
		return widgetStore.getWidget(resolved.plugin, resolved.widget)?.component
	})
}
