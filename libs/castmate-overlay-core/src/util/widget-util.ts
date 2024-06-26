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
import { OverlayWidgetConfig, OverlayWidgetOptions } from "castmate-plugin-overlays-shared"

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

interface VueResolutionContext extends RemoteTemplateResolutionContext {
	evalCounter: Ref<number>
	nextEval: number
	timer?: NodeJS.Timeout
}

export function useResolvedWidgetConfig(
	config: MaybeRefOrGetter<object | undefined>,
	widget: MaybeRefOrGetter<OverlayWidgetComponent | undefined>
) {
	const context: VueResolutionContext = {
		evalCounter: ref(0),
		nextEval: Number.POSITIVE_INFINITY,
		scheduleReEval(seconds: number) {
			const now = Date.now()
			const evalTime = now + seconds * 1000

			if (evalTime < this.nextEval) {
				if (this.timer) {
					clearTimeout(this.timer)
				}
				this.nextEval = evalTime

				this.timer = setTimeout(() => {
					this.timer = undefined
					this.nextEval = Number.POSITIVE_INFINITY
					this.evalCounter.value++
				}, evalTime - now)
			}
		},
	}

	return computed(() => {
		const remoteConfig = toValue(config)

		if (remoteConfig == undefined) return undefined

		const widgetComp = toValue(widget)

		const schema = widgetComp?.widget?.config

		if (!schema) return undefined

		context.evalCounter.value

		return resolveRemoteTemplateSchema(remoteConfig, schema, context)
	})
}
