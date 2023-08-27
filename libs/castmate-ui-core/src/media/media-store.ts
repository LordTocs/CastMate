import { defineStore } from "pinia"
import { computed, ref } from "vue"
import { MediaMetadata } from "castmate-schema"
import { ProjectItem, handleIpcMessage, useDockingStore, useIpcCaller, useIpcMessage, useProjectStore } from "../main"
import MediaBrowserPage from "../components/media/MediaBrowserPage.vue"

export const useMediaStore = defineStore("media", () => {
	const mediaMap = ref<Record<string, MediaMetadata>>({})

	const getMedia = useIpcCaller<() => MediaMetadata[]>("media", "getMedia")

	const projectStore = useProjectStore()
	const dockingStore = useDockingStore()

	const projectItem = computed<ProjectItem>(() => {
		return {
			id: "media",
			title: "Media",
			icon: "mdi mdi-multimedia",
			open() {
				dockingStore.openPage("media", "Media", MediaBrowserPage)
			},
		}
	})

	async function initialize() {
		handleIpcMessage("media", "addMedia", (event, metadata: MediaMetadata) => {
			mediaMap.value[metadata.file] = metadata
		})

		handleIpcMessage("media", "removeMedia", (event, path: string) => {
			delete mediaMap.value[path]
		})

		const existingMedia = await getMedia()

		for (const media of existingMedia) {
			mediaMap.value[media.file] = media
		}

		projectStore.registerProjectGroupItem(projectItem)
	}

	return { initialize, media: computed(() => mediaMap.value) }
})
