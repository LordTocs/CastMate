<template>
	<timed-reveal ref="alertReveal" :transition="config.transition" class="frame-sized">
		<div>
			<media-container class="alert" :media-file="activeMedia" ref="mediaHolder" :muted="isEditor">
				<template v-if="!props.config.textBelowMedia">
					<alert-text-box :box-config="config.title" :text="headerText" ref="titleBox" />
					<alert-text-box :box-config="config.subtitle" :text="messageText" ref="subtitleBox" />
				</template>
			</media-container>
			<template v-if="props.config.textBelowMedia">
				<alert-text-box :box-config="config.title" :text="headerText" ref="titleBox" />
				<alert-text-box :box-config="config.subtitle" :text="messageText" ref="subtitleBox" />
			</template>
		</div>
	</timed-reveal>
</template>

<script setup lang="ts">
import { MediaContainer, TimedReveal, declareWidgetOptions, handleOverlayRPC, useIsEditor } from "castmate-overlay-core"
import {
	OverlayBlockStyle,
	OverlayTextAlignment,
	OverlayTextStyle,
	OverlayTransitionAnimation,
	OverlayWidgetSize,
} from "castmate-plugin-overlays-shared"
import { Color, MediaFile } from "castmate-schema"
import { Duration } from "castmate-schema"
import { clearInterval } from "timers"
import { nextTick, onMounted, onUnmounted, ref, watch } from "vue"
import AlertTextBox from "../components/AlertTextBox.vue"

const isEditor = useIsEditor()

defineOptions({
	widget: declareWidgetOptions({
		id: "alert",
		name: "Alert",
		icon: "mdi mdi-alert-box-outline",
		description: "A classic alert box that can show two lines of text along with gifs, images, and videos",
		defaultSize: { width: 300, height: 200 },
		config: {
			type: Object,
			properties: {
				media: {
					type: Array,
					name: "Alert Media",
					items: {
						type: Object,
						properties: {
							media: { type: MediaFile, name: "Media", required: true, video: true, image: true },
							duration: { type: Duration, name: "Duration", required: true, default: 4 },
							weight: { type: Number, name: "Random Weight", required: true, default: 1 },
						},
					},
				},
				transition: {
					type: OverlayTransitionAnimation,
					name: "Transition",
				},
				textBelowMedia: {
					type: Boolean,
					name: "Text Below Media",
					default: true,
					required: true,
				},
				title: {
					name: "Title",
					type: Object,
					properties: {
						font: {
							type: OverlayTextStyle,
							name: "Font",
							required: true,
							default: OverlayTextStyle.factoryCreate(),
						},
						textAlign: {
							type: OverlayTextAlignment,
							name: "Text Align",
							required: true,
							default: OverlayTextAlignment.factoryCreate({ textAlign: "center" }),
						},
						block: {
							type: OverlayBlockStyle,
							name: "Block Style",
							required: true,
							default: OverlayBlockStyle.factoryCreate(),
							allowHorizontalAlign: false,
							allowMargin: false,
						},
						transition: {
							type: OverlayTransitionAnimation,
							name: "Transition",
						},
						appearDelay: {
							type: Duration,
							name: "Appear Delay",
							required: true,
							default: 0,
						},
						vanishAdvance: {
							type: Duration,
							name: "Vanish Advance",
							required: true,
							default: 0,
						},
					},
				},
				subtitle: {
					name: "Subtitle",
					type: Object,
					properties: {
						font: {
							type: OverlayTextStyle,
							name: "Font",
							required: true,
							default: OverlayTextStyle.factoryCreate(),
						},
						textAlign: {
							type: OverlayTextAlignment,
							name: "Text Align",
							required: true,
							default: OverlayTextAlignment.factoryCreate({ textAlign: "center" }),
						},
						block: {
							type: OverlayBlockStyle,
							name: "Block Style",
							required: true,
							default: OverlayBlockStyle.factoryCreate(),
							allowHorizontalAlign: false,
							allowMargin: false,
						},
						transition: {
							type: OverlayTransitionAnimation,
							name: "Transition",
						},
						appearDelay: {
							type: Duration,
							name: "Appear Delay",
							required: true,
							default: 0,
						},
						vanishAdvance: {
							type: Duration,
							name: "Vanish Advance",
							required: true,
							default: 0,
						},
					},
				},
			},
		},
	}),
})

const props = defineProps<{
	size: OverlayWidgetSize
	config: {
		duration: Duration
		transition?: OverlayTransitionAnimation
		media: { weight: number; media: MediaFile; duration: Duration }[]
		textBelowMedia: boolean
		title: {
			font: OverlayTextStyle
			textAlign: OverlayTextAlignment
			block: OverlayBlockStyle
			transition?: OverlayTransitionAnimation
			appearDelay: number
			vanishAdvance: number
		}
		subtitle: {
			font: OverlayTextStyle
			textAlign: OverlayTextAlignment
			block: OverlayBlockStyle
			transition?: OverlayTransitionAnimation
			appearDelay: number
			vanishAdvance: number
		}
	}
}>()

const headerText = ref("")
const messageText = ref("")
const activeMedia = ref<MediaFile>()
const alertColor = ref<Color>("#FFFFFF")

const mediaHolder = ref<InstanceType<typeof MediaContainer>>()
const alertReveal = ref<InstanceType<typeof TimedReveal>>()
const titleBox = ref<InstanceType<typeof AlertTextBox>>()
const subtitleBox = ref<InstanceType<typeof AlertTextBox>>()

function chooseMedia() {
	let weightTotal = 0
	const options = props.config?.media ?? []
	for (const mediaOption of options) {
		weightTotal += mediaOption.weight
	}

	let targetWeight = Math.random() * weightTotal

	for (let i = 0; i < options.length; ++i) {
		const mediaOption = options[i]
		targetWeight -= mediaOption.weight
		if (targetWeight <= 0) {
			return i
		}
	}

	return 0
}

function showAlert(header: string, message: string, color: Color, mediaIdx: number) {
	headerText.value = header
	messageText.value = message
	alertColor.value = color

	const mediaOption = props.config.media?.[mediaIdx]

	const duration = mediaOption?.duration ?? 4
	//console.log("    ")
	//console.log("    ")
	//console.log("    ")
	//console.log("Show Alert!", duration, mediaOption?.media)

	if (mediaOption) {
		activeMedia.value = mediaOption.media
	}

	nextTick(() => {
		alertReveal.value?.appear?.(duration)
		titleBox.value?.appear?.(duration)
		subtitleBox.value?.appear?.(duration)
		mediaHolder.value?.restart?.()
	})

	return duration
}

function showEditorAlert() {
	if (!isEditor) return

	const duration = showAlert("Title", "Message", "#FF0000", chooseMedia())

	timer = setTimeout(() => showEditorAlert(), (duration + 1) * 1000)
}

let timer: NodeJS.Timer | undefined = undefined
function setEditorTimer() {
	if (!isEditor) return

	showEditorAlert()
}

onMounted(() => {
	watch(
		() => props.config?.duration,
		() => {
			setEditorTimer()
		},
		{ immediate: true }
	)
})

onUnmounted(() => {
	if (timer) {
		clearTimeout(timer)
	}
})

handleOverlayRPC("showAlert", (title: string, subtitle: string, idx: number) => {
	return showAlert(title, subtitle, "#000000", idx)
})
</script>

<style scoped>
.alert {
	position: relative;
	color: white;
	width: 100%;
	height: 100%;
}

.frame-sized {
	position: absolute;
	inset: 0px;
}
</style>
