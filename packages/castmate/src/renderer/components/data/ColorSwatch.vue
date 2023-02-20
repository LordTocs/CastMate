<template>
	<div class="swatch" :style="{ backgroundColor: cssColor }">
		<v-icon v-if="value.mode == 'template'" icon="mdi-code-braces" />
		<v-icon v-else icon="mdi-lightbulb-on-outline" />
	</div>
</template>

<script>
import iro from "@jaames/iro"
export default {
	props: {
		value: {},
	},
	computed: {
		color() {
			if (!this.value || !this.value.mode)
				return { r: 128, g: 128, b: 128 }

			if (this.value.mode == "color") {
				return iro.Color.hsvToRgb({
					h: this.value.hue,
					s: this.value.sat,
					v: this.value.bri,
				})
			} else if (this.value.mode == "temp") {
				return iro.Color.kelvinToRgb(this.value.temp)
			}
			return { r: 0, g: 0, b: 128 }
		},
		cssColor() {
			return `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 1)`
		},
	},
}
</script>

<style scoped>
.swatch {
	display: inline-block;
	padding: 3px;
	border-radius: 0.05em;
	border-style: solid;
	border-width: 1px;
	border-color: #efefef;
	color: white;
	line-height: 1;
}
</style>
