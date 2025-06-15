import { useDashboardWidget, useDashboardWidgets } from "castmate-dashboard-widget-loader"
import { DashboardWidget } from "castmate-plugin-dashboards-shared"
import { handleIpcMessage, useIpcCaller } from "castmate-ui-core"
import { nanoid } from "nanoid/non-secure"
import { defineStore } from "pinia"
import { MaybeRefOrGetter, Ref, WatchStopHandle, computed, onBeforeUnmount, onMounted, ref, toValue, watch } from "vue"
import { useResolvedWidgetConfig } from "castmate-dashboard-core"
import { useResolvedSchema } from "castmate-satellite-ui-core"

const startEdit = useIpcCaller<(id: string, plugin: string, widget: string, initialConfig: object) => any>(
	"dashboards",
	"startEdit"
)
const stopEdit = useIpcCaller<(id: string) => any>("dashboards", "stopEdit")
const updateEdit = useIpcCaller<(id: string, plugin: string, widget: string, newConfig: object) => any>(
	"dashboards",
	"updateEdit"
)

function getEditUpdate(config: DashboardWidget) {
	return {
		plugin: config.plugin,
		widget: config.widget,
		config: config.config,
	}
}

interface ActiveRemoteConfig {
	id: string
	effect: WatchStopHandle
	resolved: Ref<object | undefined>
}

export const useDashboardRemoteConfigStore = defineStore("dashboard-config-store", () => {
	const remotes = new Map<string, ActiveRemoteConfig>()

	function initialize() {
		handleIpcMessage("dashboards", "configUpdated", (event, id: string, config: object) => {
			const remote = remotes.get(id)
			if (!remote) return

			remote.resolved.value = config
		})
	}

	function start(config: MaybeRefOrGetter<DashboardWidget>, resolved: Ref<object | undefined>) {
		const id = nanoid()

		const configValue = toValue(config)
		startEdit(id, configValue.plugin, configValue.widget, configValue.config)

		const updateEffect = watch(
			() => getEditUpdate(toValue(config)),
			(update) => {
				updateEdit(id, update.plugin, update.widget, update.config)
			},
			{ deep: true }
		)

		const remote = {
			id,
			effect: updateEffect,
			resolved,
		} as ActiveRemoteConfig

		remotes.set(id, remote)

		return id
	}

	function stop(id: string) {
		const remote = remotes.get(id)
		if (!remote) return

		stopEdit(id)

		remote.effect()

		remotes.delete(id)
	}

	return {
		initialize,
		start,
		stop,
	}
})

export function useRemoteDashboardConfig(config: MaybeRefOrGetter<DashboardWidget>) {
	const configStore = useDashboardRemoteConfigStore()
	const widget = useDashboardWidget(config)

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
