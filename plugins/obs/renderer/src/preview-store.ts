import { useIpcCaller, useResourceIPCCaller, useResourceStore } from "castmate-ui-core"
import { defineStore } from "pinia"
import {
	MaybeRefOrGetter,
	Ref,
	ref,
	shallowRef,
	computed,
	markRaw,
	onBeforeUnmount,
	onMounted,
	toValue,
	watch,
} from "vue"

interface OBSPreview {
	refCount: number
	connectionId: string
	sourceId: string
	timestamp: number
	bufferString: Ref<string | undefined>
	updateTimer: NodeJS.Timeout
}

export const usePreviewStore = defineStore("obs-preview", () => {
	const previews = new Map<string, OBSPreview>()

	const getPreviewFromOBS = useIpcCaller<(type: string, id: string, func: string) => string>(
		"resources",
		"callIPCMember"
	)

	async function updatePreview(preview: OBSPreview) {
		const imageData = await getPreviewFromOBS("OBSConnection", preview.connectionId, "getPreview")
		preview.bufferString.value = imageData
		preview.timestamp = Date.now()
	}

	function destroyPreview(preview: OBSPreview) {
		const storeId = `${preview.connectionId}.${preview.sourceId}`
		previews.delete(storeId)
		clearInterval(preview.updateTimer)
	}

	function watchPreview(connectionId: string) {
		const preview = previews.get(`${connectionId}.program`)

		if (preview) {
			preview.refCount++
		} else {
			const newPreview: OBSPreview = {
				refCount: 1,
				connectionId,
				sourceId: "program",
				timestamp: 0,
				bufferString: ref(undefined),
				updateTimer: setInterval(() => updatePreview(newPreview), 20000),
			}

			updatePreview(newPreview)

			previews.set(`${connectionId}.program`, newPreview)

			return newPreview
		}
	}

	function unwatchPreview(preview: OBSPreview) {
		preview.refCount--

		if (preview.refCount == 0) {
			destroyPreview(preview)
		}
	}

	return {
		watchPreview,
		unwatchPreview,
	}
})

export function useObsProgramPreview(connectionId: MaybeRefOrGetter<string | undefined>) {
	const previewStore = usePreviewStore()

	let preview = shallowRef<OBSPreview | undefined>(undefined)

	onMounted(() => {
		watch(
			() => toValue(connectionId),
			(newConnectionId, oldConnectionid) => {
				if (preview.value) {
					previewStore.unwatchPreview(preview.value)
				}

				if (newConnectionId != null) {
					preview.value = previewStore.watchPreview(newConnectionId)
				} else {
					preview.value = undefined
				}
			},
			{ immediate: true }
		)
	})

	onBeforeUnmount(() => {
		if (preview.value) {
			previewStore.unwatchPreview(preview.value)
		}
	})

	return computed<string | undefined>(() => {
		const result = preview.value?.bufferString?.value
		if (!result) return undefined
		return result
	})
}
