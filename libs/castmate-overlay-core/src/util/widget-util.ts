import { RemoteTemplateResolutionContext, SchemaObj, resolveRemoteTemplateSchema } from "castmate-schema"
import { Component, onBeforeUnmount, onMounted } from "vue"
import { OverlayWidgetOptions } from "castmate-plugin-overlays-shared"
import { useSatelliteWidgetBridge } from "castmate-satellite-ui-core"

export function declareWidgetOptions<PropSchema extends SchemaObj>(opts: OverlayWidgetOptions<PropSchema>) {
	return opts
}

export type OverlayWidgetComponent = Component & { widget: OverlayWidgetOptions }

export interface OverlayPluginOptions {
	id: string
	widgets: OverlayWidgetComponent[]
}

export function definePluginOverlays(opts: { id: string; widgets: Component[] }) {
	return opts as OverlayPluginOptions
}

export function handleOverlayRPC(id: string, func: (...args: any[]) => any) {
	const bridge = useSatelliteWidgetBridge()

	onMounted(() => {
		bridge.registerRPC(id, func)
	})

	onBeforeUnmount(() => {
		bridge.unregisterRPC(id)
	})
}

export function useCallOverlayRPC<T extends (...args: any) => any>(id: string) {
	const bridge = useSatelliteWidgetBridge()

	return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
		const result = await bridge.callRPC(id, ...args)
		return result as ReturnType<T>
	}
}
