<template>
	<p class="overlay-label" :style="fontStyle">{{ message }}</p>
</template>

<script>
import { OverlayFontStyle } from "../typeProxies.js"
export default {
	props: {
		message: {
			type: String,
			default: () => "Text Label",
			template: true,
			area: true,
		},
		textStyle: {
			type: OverlayFontStyle,
			name: "Style",
			exampleText: "Text",
			default: {
				fontFamily: "Impact",
				fontSize: 65,
				fontColor: "#FFFFFF",
				stroke: {
					width: 4,
					color: "#000000",
				},
			},
		},
	},
	computed: {
		fontStyle() {
			return OverlayFontStyle.getStyleObj(this.textStyle)
		},
	},
	widget: {
		name: "Label",
		description: "Display some text on screen.",
		icon: "mdi-cursor-text",
		defaultSize: {
			width: 300,
			height: 100,
		},
	},
}
</script>

<style scoped>
.overlay-label {
	white-space: pre-wrap;
}
</style>
