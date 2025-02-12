import { computed, ref } from "vue"
import { TwitchCategory, StreamInfo } from "castmate-plugin-twitch-shared"
import { handleIpcMessage, useIpcCaller } from "castmate-ui-core"
import { defineStore } from "pinia"

export const useCategoryStore = defineStore("twitch-categories", () => {
	const searchCategories = useIpcCaller<(query: string) => TwitchCategory[]>("twitch", "searchCategories")
	const getCategoryById = useIpcCaller<(id: string) => TwitchCategory | undefined>("twitch", "getCategoryById")

	const getStreamInfo = useIpcCaller<() => StreamInfo>("twitch", "getStreamInfo")

	const setStreamInfo = useIpcCaller<(info: StreamInfo) => any>("twitch", "setStreamInfo")

	const activeStreamInfo = ref<StreamInfo>({ title: undefined, category: undefined, tags: [] })

	async function initialize() {
		activeStreamInfo.value = await getStreamInfo()

		handleIpcMessage("twitch", "updateStreamInfo", (event, info: StreamInfo) => {
			activeStreamInfo.value = info
		})
	}

	return {
		activeStreamInfo: computed(() => activeStreamInfo.value),
		searchCategories,
		getCategoryById,
		setStreamInfo,
		initialize,
	}
})
