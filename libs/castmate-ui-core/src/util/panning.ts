import { computed, inject, markRaw, type ComputedRef } from "vue"

export interface PanState {
	panX: number
	panY: number
	zoomX: number
	zoomY: number
	panning: boolean
}

export interface PanQuery {
	computePosition(ev: { clientX: number; clientY: number }): { x: number; y: number }
}

export function usePanQuery() {
	return inject<PanQuery>("panQuery", {
		computePosition(ev) {
			return { x: 0, y: 0 }
		},
	})
}

export function usePanState() {
	return inject<ComputedRef<PanState>>(
		"panState",
		computed(() => ({
			panX: 0,
			panY: 0,
			zoomX: 1,
			zoomY: 1,
			panning: false,
		}))
	)
}
