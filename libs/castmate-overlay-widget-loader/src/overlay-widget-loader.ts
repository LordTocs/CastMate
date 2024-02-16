import { OverlayPluginOptions } from "castmate-overlay-core"
import overlaysPlugin from "castmate-plugin-overlays-overlays"
import { defineStore } from "pinia"
import { ref, Component } from "vue"

export const useOverlayWidgets = defineStore("castmate-overlay-widgets", () => {
	const widgets = ref(new Map<string, Component>())

	function loadPluginWidgets(opts: OverlayPluginOptions) {
		for (const widget of opts.widgets) {
			console.log("Loading", widget)
		}
	}

	return { loadPluginWidgets }
})

export function loadOverlayWidgets() {
	const widgets = useOverlayWidgets()

	widgets.loadPluginWidgets(overlaysPlugin)
}
