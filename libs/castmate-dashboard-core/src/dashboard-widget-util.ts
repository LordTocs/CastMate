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
import { DashboardWidgetOptions } from "castmate-plugin-dashboards-shared"

export function declareWidgetOptions<PropSchema extends SchemaObj>(opts: DashboardWidgetOptions<PropSchema>) {
	return opts
}

export type DashboardWidgetComponent = Component & { widget: DashboardWidgetOptions }

export interface DashboardPluginOptions {
	id: string
	widgets: DashboardWidgetComponent[]
}

export function definePluginDashboard(opts: { id: string; widgets: Component[] }) {
	return opts as DashboardPluginOptions
}

interface VueResolutionContext extends RemoteTemplateResolutionContext {
	evalCounter: Ref<number>
	nextEval: number
	timer?: NodeJS.Timeout
}

export function useResolvedWidgetConfig(
	config: MaybeRefOrGetter<object | undefined>,
	widget: MaybeRefOrGetter<DashboardWidgetComponent | undefined>
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
