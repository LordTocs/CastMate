import { defineStore } from "pinia"
import { ref, computed } from "vue"
import loadWidget, { getAllWidgets } from "castmate-overlay-components"
import { cleanVuePropSchema } from "../utils/vueSchemaUtils"
import { useIpc } from "../utils/ipcMap"

export const useOverlayStore = defineStore("overlay", () => {
	const widgetTypes = ref({})

	const setOverlayTypes = useIpc("overlays", "setTypes")

	async function init() {
		const widgetIds = getAllWidgets()

		const widgetModules = await Promise.all(
			widgetIds.map((wid) => loadWidget(wid))
		)

		for (let i = 0; i < widgetModules.length; ++i) {
			const widgetModule = widgetModules[i].default

			widgetTypes.value[widgetIds[i]] = {
				type: widgetIds[i],
				props: cleanVuePropSchema(widgetModule.props),
				...widgetModule.widget,
			}
		}

		setOverlayTypes(widgetTypes.value)
	}

	return { init, widgetTypes: computed(() => widgetTypes.value) }
})
