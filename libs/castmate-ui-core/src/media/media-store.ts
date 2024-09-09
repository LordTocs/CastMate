import { defineStore } from "pinia"
import { computed, MaybeRefOrGetter, Ref, ref, toValue } from "vue"
import { MediaMetadata } from "castmate-schema"
import { ProjectItem, handleIpcMessage, useDockingStore, useIpcCaller, useIpcMessage, useProjectStore } from "../main"
import MediaBrowserPage from "../components/media/MediaBrowserPage.vue"
import { useFileDragDrop } from "../util/file-drop"
import path from "path"

export const useMediaStore = defineStore("media", () => {
	const mediaMap = ref<Record<string, MediaMetadata>>({})

	const getMedia = useIpcCaller<() => MediaMetadata[]>("media", "getMedia")
	const openMediaFolder = useIpcCaller<() => any>("media", "openMediaFolder")
	const exploreMediaItem = useIpcCaller<(path: string) => any>("media", "exploreMediaItem")

	const downloadMediaMain = useIpcCaller<(url: string, mediaPath: string) => any>("media", "downloadMedia")
	const copyMediaMain = useIpcCaller<(localPath: string, mediaPath: string) => any>("media", "copyMedia")

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
			console.log("Adding", metadata.path)
			mediaMap.value[metadata.path] = metadata
		})

		handleIpcMessage("media", "removeMedia", (event, path: string) => {
			console.log("Removing", path)
			delete mediaMap.value[path]
		})

		const existingMedia = await getMedia()

		for (const media of existingMedia) {
			mediaMap.value[media.path] = media
		}

		projectStore.registerProjectGroupItem(projectItem)
	}

	async function downloadMedia(path: string, mediaPath: string) {
		await downloadMediaMain(path, mediaPath)
	}

	async function copyMedia(localPath: string, mediaPath: string) {
		await copyMediaMain(localPath, mediaPath)
	}

	return {
		initialize,
		media: computed(() => mediaMap.value),
		openMediaFolder,
		exploreMediaItem,
		downloadMedia,
		copyMedia,
	}
})

export function useMediaDrop(
	element: MaybeRefOrGetter<HTMLElement | undefined>,
	subPath: MaybeRefOrGetter<string>,
	nestingClass?: string
) {
	const mediaStore = useMediaStore()

	return useFileDragDrop(
		element,
		(files) => {
			const basepath = toValue(subPath)

			for (const file of files) {
				console.log("DROP", file)
				if (
					!(
						file.mimetype.startsWith("image") ||
						file.mimetype.startsWith("audio") ||
						file.mimetype.startsWith("video")
					)
				)
					continue

				const pathParse = path.parse(file.path)

				const mediaName = pathParse.base

				const proposedMediaPath = path.join(basepath, mediaName).replaceAll("\\", "/")

				if (mediaStore.media[proposedMediaPath]) {
					console.log("ALREADY HAS PATH", proposedMediaPath)
					continue
				}

				if (file.remote) {
					console.log("DOWNLOAD", file.path, "to", proposedMediaPath)
					mediaStore.downloadMedia(file.path, proposedMediaPath)
				} else {
					console.log("COPY", file.path, "to", proposedMediaPath)
					mediaStore.copyMedia(file.path, proposedMediaPath)
				}
			}
		},
		nestingClass
	)
}
