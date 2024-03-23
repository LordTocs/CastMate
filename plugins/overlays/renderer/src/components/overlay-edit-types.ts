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
