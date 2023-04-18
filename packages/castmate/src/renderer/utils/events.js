import { watch, isRef, onMounted, onBeforeUnmount, ref, unref } from "vue"

import { useEventListener } from "@vueuse/core"
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
export function useElementScroll(element) {
	const y = ref(unref(element)?.scrollTop ?? 0)
	const x = ref(unref(element)?.scrollLeft ?? 0)

	useEventListener(
		element,
		"scroll",
		() => {
			x.value = unref(element).scrollLeft
			y.value = unref(element).scrollTop
		},
		{
			capture: false,
			passive: true,
		}
	)

	return { x, y }
}
