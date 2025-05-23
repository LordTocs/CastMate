import { useEventListener } from "@vueuse/core"
import { computed, MaybeRefOrGetter, ref, Ref, toValue } from "vue"
import { isUnnestedChild } from "./dom"

const { webUtils } = require("electron")

interface FromTo {
	fromElement?: HTMLElement
	toElement?: HTMLElement
}
export interface DroppedFile {
	path: string
	mimetype: string
	remote: boolean
}

export type FileDropEvent = (files: DroppedFile[]) => any

async function getMimeType(url: string) {
	console.log("Getting Mimetype", url)
	const response = await fetch(url, { method: "HEAD" })

	if (!response.ok) return undefined

	return response.headers.get("Content-Type") ?? undefined
}

export function useFileDragDrop(
	element: MaybeRefOrGetter<HTMLElement | undefined>,
	onDrop: FileDropEvent,
	nestingClass?: string
) {
	const hoveringFiles = ref(false)

	useEventListener(element, "dragenter", (ev: DragEvent) => {
		if (!ev.dataTransfer || !ev.dataTransfer.types.includes("Files")) return

		const elem = toValue(element)
		if (!elem) return

		const ft = ev as FromTo
		const toIn = isUnnestedChild(elem, ft.toElement, nestingClass)
		const fromIn = isUnnestedChild(elem, ft.fromElement, nestingClass)

		console.log("File Enter", ft, fromIn, toIn)

		if (fromIn && !toIn) {
			hoveringFiles.value = false
		} else if (!fromIn && toIn) {
			hoveringFiles.value = true
		} else {
			return
		}

		ev.preventDefault()
		//ev.stopPropagation()

		//console.log("FileEnter", ev, ev.dataTransfer.files)
		//hoveringFiles.value = true
	})

	useEventListener(element, "dragleave", (ev: DragEvent) => {
		if (!ev.dataTransfer || !ev.dataTransfer.types.includes("Files")) return

		const elem = toValue(element)
		if (!elem) return

		const ft = ev as FromTo
		const toIn = isUnnestedChild(elem, ft.toElement, nestingClass)
		const fromIn = isUnnestedChild(elem, ft.fromElement, nestingClass)

		console.log("File Leave", ft, fromIn, toIn)

		if (fromIn && !toIn) {
			hoveringFiles.value = true
		} else if (!fromIn && toIn) {
			hoveringFiles.value = false
		} else {
			return
		}

		ev.preventDefault

		//console.log("FileLeave", ev, ev.dataTransfer.files)
		//hoveringFiles.value = false
	})

	useEventListener(element, "dragover", (ev: DragEvent) => {
		if (!ev.dataTransfer || !ev.dataTransfer.types.includes("Files")) return

		ev.preventDefault()
		ev.stopPropagation()

		ev.dataTransfer.dropEffect = "copy"
	})

	useEventListener(element, "drop", async (ev: DragEvent) => {
		if (!ev.dataTransfer || !ev.dataTransfer.types.includes("Files")) return

		hoveringFiles.value = false

		ev.preventDefault()
		ev.stopPropagation()

		const urlList = ev.dataTransfer.getData("text/uri-list")

		const result: DroppedFile[] = []

		if (urlList) {
			const urls = urlList.split("\n").map((u) => u.trim())
			const mimetypes = await Promise.allSettled(urls.map((url) => getMimeType(url)))

			for (let i = 0; i < mimetypes.length; ++i) {
				const mimetypeResult = mimetypes[i]
				if (mimetypeResult.status != "fulfilled") {
					continue
				}

				const url = urls[i]
				const mimetype = mimetypeResult.value

				if (mimetype == undefined) continue

				result.push({ path: url, mimetype, remote: true })
			}
		} else {
			for (const file of ev.dataTransfer.files) {
				if (file.type) {
					result.push({ path: webUtils.getPathForFile(file), mimetype: file.type, remote: false })
				}
			}
		}

		onDrop(result)
	})

	return {
		hoveringFiles: computed(() => hoveringFiles.value),
	}
}
