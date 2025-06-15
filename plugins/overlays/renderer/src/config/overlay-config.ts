import { useOverlayWidget, useOverlayWidgets } from "castmate-overlay-widget-loader"
import { OverlayConfig, OverlayWidgetConfig } from "castmate-plugin-overlays-shared"
import { useResolvedSchema } from "castmate-satellite-ui-core"
import { handleIpcMessage, useIpcCaller, useIpcMessage } from "castmate-ui-core"
import { nanoid } from "nanoid/non-secure"
import { defineStore } from "pinia"
import {
	ComputedRef,
	MaybeRefOrGetter,
	ReactiveEffect,
	Ref,
	WatchStopHandle,
	computed,
	onBeforeUnmount,
	onMounted,
	ref,
	toValue,
	watch,
} from "vue"

const startEdit = useIpcCaller<(id: string, plugin: string, widget: string, initialConfig: object) => any>(
	"overlays",
	"startEdit"
)
const stopEdit = useIpcCaller<(id: string) => any>("overlays", "stopEdit")
const updateEdit = useIpcCaller<(id: string, plugin: string, widget: string, newConfig: object) => any>(
	"overlays",
	"updateEdit"
)

interface ActiveRemoteConfig {
	id: string
	effect: WatchStopHandle
	resolved: Ref<object | undefined>
}

function getEditUpdate(config: OverlayWidgetConfig) {
	return {
		plugin: config.plugin,
		widget: config.widget,
		config: config.config,
	}
}

export const useOverlayRemoteConfigStore = defineStore("overlay-remote-config", () => {
	const remotes = new Map<string, ActiveRemoteConfig>()

	function initialize() {
		handleIpcMessage("overlays", "configUpdated", (event, id: string, config: object) => {
			const remote = remotes.get(id)
			if (!remote) return

			remote.resolved.value = config
		})
	}

	function start(config: MaybeRefOrGetter<OverlayWidgetConfig>, resolved: Ref<object | undefined>) {
		const id = nanoid()

		const configValue = toValue(config)

		console.log("Starting Overlay Edit", id, configValue.plugin, configValue.widget, configValue.config)

		startEdit(id, configValue.plugin, configValue.widget, configValue.config) //Setup the main process evaluation

		const effect = watch(
			() => getEditUpdate(toValue(config)),
			(update) => {
				//console.log("Updating Overlay Edit", id, update.plugin, update.widget, update.config)
				updateEdit(id, update.plugin, update.widget, update.config)
			},
			{ deep: true }
		)

		const remote: ActiveRemoteConfig = {
			id,
			effect,
			resolved,
		}

		remotes.set(id, remote)

		return id
	}

	function stop(id: string) {
		const remote = remotes.get(id)
		if (!remote) return

		stopEdit(id)

		console.log("Stopping Overlay Edit", id)

		//Stop the effect
		remote.effect()

		remotes.delete(id)
	}

	return {
		initialize,
		start,
		stop,
	}
})

export function useRemoteOverlayConfig(config: MaybeRefOrGetter<OverlayWidgetConfig>) {
	const configStore = useOverlayRemoteConfigStore()
	const widget = useOverlayWidget(config)

	let id = ""
	const remote = ref<object>()

	const resolved = useResolvedSchema(config, widget.value?.widget.config)
	onMounted(() => {
		id = configStore.start(config, remote)
	})

	onBeforeUnmount(() => {
		configStore.stop(id)
	})

	return computed(() => resolved.value)
}
