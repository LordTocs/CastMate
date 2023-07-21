import { inject, type Ref } from "vue"

export interface PanState {
	panX: number
	panY: number
	zoomX: number
	zoomY: number
	panning: boolean
}

export function usePanState() {
	return inject<Ref<PanState>>("panState")
}
