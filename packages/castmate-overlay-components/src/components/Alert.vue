<template>
	<timed-reveal
		ref="alertReveal"
		:animation="alertAnimation"
		:transition="alertTransition"
		class="frame-sized"
	>
		<div>
			<media-container ref="media" class="alert" :media-file="media">
				<template v-if="!textBelowMedia">
					<div
						class="alert-head"
						:style="getPaddingStyle(titleFormat?.padding)"
					>
						<timed-reveal
							ref="titleReveal"
							:animation="titleAnimation"
							:transition="titleFormat?.transition?.duration"
							:appear-delay="titleFormat?.timing?.appearDelay"
							:vanish-advance="titleFormat?.timing?.vanishAdvance"
						>
							<p :style="getFontStyle(titleFormat?.style)">
								{{ header }}
							</p>
						</timed-reveal>
					</div>
					<div
						class="alert-body"
						:style="getPaddingStyle(messageFormat?.padding)"
					>
						<timed-reveal
							ref="messageReveal"
							:animation="messageAnimation"
							:transition="messageFormat?.transition?.duration"
							:appear-delay="messageFormat?.timing?.appearDelay"
							:vanish-advance="
								messageFormat?.timing?.vanishAdvance
							"
						>
							<p :style="getFontStyle(messageFormat?.style)">
								{{ message }}
							</p>
						</timed-reveal>
					</div>
				</template>
			</media-container>
			<template v-if="textBelowMedia">
				<div
					class="alert-head"
					:style="getPaddingStyle(titleFormat?.padding)"
				>
					<timed-reveal
						ref="titleReveal"
						:animation="titleAnimation"
						:transition="titleFormat?.transition?.duration"
						:appear-delay="titleFormat?.timing?.appearDelay"
						:vanish-advance="titleFormat?.timing?.vanishAdvance"
					>
						<p :style="getFontStyle(titleFormat?.style)">
							{{ header }}
						</p>
					</timed-reveal>
				</div>
				<div
					class="alert-body"
					:style="getPaddingStyle(messageFormat?.padding)"
				>
					<timed-reveal
						ref="messageReveal"
						:animation="messageAnimation"
						:transition="messageFormat?.transition?.duration"
						:appear-delay="messageFormat?.timing?.appearDelay"
						:vanish-advance="messageFormat?.timing?.vanishAdvance"
					>
						<p :style="getFontStyle(messageFormat?.style)">
							{{ message }}
						</p>
					</timed-reveal>
				</div>
			</template>
		</div>
	</timed-reveal>
</template>

<script>
import {
	OverlayFontStyle,
	OverlayPadding,
	OverlayTransition,
	OverlayTransitionTiming,
} from "../typeProxies.js"
import MediaContainer from "../utils/MediaContainer.vue"
import { MediaFile } from "../typeProxies.js"
import TimedReveal from "../utils/TimedReveal.vue"
import Revealers from "../utils/Revealers.js"
import _merge from "lodash/merge"

export default {
	components: { MediaContainer, TimedReveal },
	inject: ["isEditor"],
	props: {
		media: {
			type: MediaFile,
			name: "Alert Media",
			image: true,
			video: true,
		},
		duration: { type: Number, name: "Duration", default: 4 },
		transition: {
			type: OverlayTransition,
			name: "Transition",
			default: () => ({ animation: "Fade", duration: 0.1 }),
		},
		textBelowMedia: {
			type: Boolean,
			name: "Text Below Media",
			default: true,
			required: true,
		},
		titleFormat: {
			type: Object,
			name: "Title",
			properties: {
				style: {
					type: OverlayFontStyle,
					name: "Style",
					exampleText: "Title",
					default: {
						fontFamily: "Impact",
						fontSize: 65,
						fontColor: "#FFFFFF",
						stroke: {
							width: 1,
							color: { ref: "alertColor" },
						},
					},
				},
				padding: { type: OverlayPadding, name: "Padding" },
				transition: {
					type: OverlayTransition,
					name: "Transition",
					default: {
						duration: 0.1,
						animation: "Fade",
					},
				},
				timing: {
					type: OverlayTransitionTiming,
					name: "Timing",
					default: {
						appearDelay: 1,
						vanishAdvance: 0.25,
					},
				},
			},
		},
		messageFormat: {
			type: Object,
			name: "Message",
			properties: {
				style: {
					type: OverlayFontStyle,
					name: "Style",
					exampleText: "Message",
					default: {
						fontFamily: "Impact",
						fontSize: 50,
						fontColor: "#FFFFFF",
						stroke: {
							width: 1,
							color: { ref: "alertColor" },
						},
					},
				},
				padding: { type: OverlayPadding, name: "Padding" },
				transition: {
					type: OverlayTransition,
					name: "Transition",
					default: {
						duration: 0.1,
						animation: "Fade",
					},
				},
				timing: {
					type: OverlayTransitionTiming,
					name: "Timing",
					default: {
						appearDelay: 1,
						vanishAdvance: 0.25,
					},
				},
			},
		},
	},
	data() {
		return {
			message: null,
			header: null,
			colorRefs: {
				alertColor: "#FF0000",
			},
		}
	},
	widget: {
		name: "Alert Box",
		description: "An ALERT!",
		icon: "mdi-alert-box",
		testActions: ["alerts.alert"],
		colorRefs: ["alertColor"],
		defaultSize: {
			width: 300,
			height: 200,
		},
	},
	computed: {
		alertAnimation() {
			return Revealers[this.transition?.animation || "None"]
		},
		alertTransition() {
			return this.transition?.duration || 0.5
		},
		titleAnimation() {
			return Revealers[this.titleFormat?.transition?.animation || "None"]
		},
		messageAnimation() {
			return Revealers[
				this.messageFormat?.transition?.animation || "None"
			]
		},
	},
	methods: {
		getFontStyle(headerStyle) {
			return OverlayFontStyle.getStyleObj(headerStyle, this.colorRefs)
		},
		getPaddingStyle(padding) {
			return OverlayPadding.getStyleObject(padding)
		},
		showAlert(header, message, color) {
			this.header = header
			this.message = message
			this.colorRefs.alertColor = color

			this.$refs.alertReveal?.appear(this.duration)
			this.$refs.titleReveal?.appear(this.duration)
			this.$refs.messageReveal?.appear(this.duration)
			this.$refs.media.restart()
		},
		setEditorTimer() {
			if (this.isEditor) {
				if (this.timer) {
					clearInterval(this.timer)
					this.timer = null
				}
				//Show right away
				this.showAlert("Title", "Message", "#FF0000")
				//Show in the future
				this.timer = setInterval(
					() => this.showAlert("Title", "Message", "#FF0000"),
					(this.duration + 1) * 1000
				)
			}
		},
	},
	mounted() {
		this.setEditorTimer()
	},
	unmounted() {
		if (this.timer) {
			clearInterval(this.timer)
		}
	},
	watch: {
		duration() {
			this.setEditorTimer()
		},
	},
}
</script>

<style scoped>
p {
	margin: 0;
}

.alert {
	position: relative;
	color: white;
	width: 100%;
	height: 100%;
}

.alert-head {
	font-size: 40px;
	text-align: center;
}

.alert-body {
	font-size: 30px;
	text-align: center;
}

.frame-sized {
	position: absolute;
	inset: 0px;
}
</style>
