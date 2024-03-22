import { OverlayWidgetComponent } from "castmate-overlay-core"
import { OverlayWidgetConfig } from "castmate-plugin-overlays-shared"
import { RemoteTemplateResolutionContext, resolveRemoteTemplateSchema } from "castmate-schema"
import { PanState } from "castmate-ui-core"
import { ComputedRef, MaybeRefOrGetter, Ref, computed, ref, toValue } from "vue"

export interface OverlayEditView {
	panState: PanState
}

export interface OverlayEditorView {
	editView: OverlayEditView
	obsId: string | undefined
	showPreview: boolean
}

interface VueResolutionContext extends RemoteTemplateResolutionContext {
	evalCounter: Ref<number>
	nextEval: number
	timer?: NodeJS.Timeout
}

export function useResolvedWidgetConfig(
	config: MaybeRefOrGetter<OverlayWidgetConfig>,
	widget: ComputedRef<OverlayWidgetComponent | undefined>
) {
	const context: VueResolutionContext = {
		evalCounter: ref(0),
		nextEval: Number.POSITIVE_INFINITY,
		scheduleReEval(seconds: number) {
			const evalTime = Date.now() + seconds

			if (evalTime < this.nextEval) {
				if (this.timer) {
					clearTimeout(this.timer)
				}
				this.nextEval = evalTime

				this.timer = setTimeout(() => {
					this.timer = undefined
					this.nextEval = Number.POSITIVE_INFINITY
					this.evalCounter.value++
				})
			}
		},
	}

	return computed(() => {
		const remoteConfig = toValue(config)

		const schema = widget.value?.widget?.config

		if (!schema) return {}

		context.evalCounter.value

		return resolveRemoteTemplateSchema(remoteConfig.config, schema, context)
	})
}
