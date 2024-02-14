import { PanState } from "castmate-ui-core"

export interface OverlayEditView {
	panState: PanState
}

export interface OverlayEditorView {
	editView: OverlayEditView
}
