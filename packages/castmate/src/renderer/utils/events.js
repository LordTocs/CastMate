import { watch, isRef, onMounted, onBeforeUnmount, unref } from "vue"

/**
 * @template {keyof WindowEventMap} K
 * @param {K} event
 * @param {(this: Window, ev: WindowEventMap[K]) => any} handler
 */
export function useWindowEventListener(event, handler) {
	// otherwise use the mounted hook
	onMounted(() => {
		window.addEventListener(event, handler)
	})
	// clean it up
	onBeforeUnmount(() => {
		window.removeEventListener(event, handler)
	})
}
