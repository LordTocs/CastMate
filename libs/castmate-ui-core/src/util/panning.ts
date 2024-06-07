import { computed, inject, markRaw, type ComputedRef } from "vue"

export interface PanState {
	panX: number
	panY: number
	zoomX: number
	zoomY: number
	panning: boolean
}

export interface PanQuery {
	/**
	 * Computes client position relative to the pan, but not scale.
	 */
	computePosition(ev: { clientX: number; clientY: number }): { x: number; y: number }
	getPanClientRect(): DOMRect
}

export function usePanQuery() {
	return inject<PanQuery>("panQuery", {
		computePosition(ev) {
			return { x: 0, y: 0 }
		},
		getPanClientRect() {
			return DOMRect.fromRect({ x: 0, y: 0, width: 0, height: 0 })
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
