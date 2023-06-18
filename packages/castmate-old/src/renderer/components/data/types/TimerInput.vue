<template>
	<div style="d-flex flex-row">
		<time-input
			v-model.lazy="intervalStr"
			label="Interval"
			:density="density"
		/>
		<time-input v-model.lazy="offsetStr" label="Delay" :density="density" />
	</div>
</template>

<script>
import TimeInput from "./TimeInput.vue"
export default {
	props: {
		modelValue: {},
		density: { type: String },
	},
	components: { TimeInput },
	computed: {
		interval() {
			if (!this.modelValue) return null

			const [interval, offset] = this.modelValue.split("+")
			return Number(interval)
		},
		offset() {
			if (!this.modelValue) return null

			const [interval, offset] = this.modelValue.split("+")
			return Number(offset)
		},
		intervalStr: {
			get() {
				if (this.interval == null) return null
				return this.formatTimeStr(this.interval)
			},
			set(newValue) {
				const seconds = this.parseTimeStr(newValue)
				this.$emit(
					"update:modelValue",
					seconds + "+" + (this.offset != null ? this.offset : "0")
				)
			},
		},
		offsetStr: {
			get() {
				if (this.offset == null) return null
				return this.formatTimeStr(this.offset)
			},
			set(newValue) {
				const seconds = this.parseTimeStr(newValue)
				this.$emit(
					"update:modelValue",
					(this.interval != null ? this.interval : "0") +
						"+" +
						seconds
				)
			},
		},
	},
	methods: {
		parseTimeStr(str) {
			let [hours, minutes, seconds] = str.split(":")
			if (seconds == undefined) {
				console.log("Shuffle parse")
				seconds = minutes
				minutes = hours
				hours = 0
			}
			if (seconds == undefined) {
				seconds = minutes
				minutes = 0
			}
			console.log(
				"Hours",
				Number(hours),
				"Minutes",
				Number(minutes),
				"Seconds",
				Number(seconds)
			)
			return (
				Number(hours) * 60 * 60 + Number(minutes) * 60 + Number(seconds)
			)
		},
		formatTimeStr(time) {
			const hours = Math.floor(time / (60 * 60))
			let remaining = time - hours * 60 * 60
			const minutes = Math.floor(remaining / 60)
			remaining = remaining - minutes * 60
			const seconds = Math.floor(remaining)

			if (hours > 0) {
				return (
					hours +
					":" +
					String(minutes).padStart(2, "0") +
					":" +
					String(seconds).padStart(2, "0")
				)
			} else {
				return (
					String(minutes).padStart(2, "0") +
					":" +
					String(seconds).padStart(2, "0")
				)
			}
		},
	},
}
</script>

<style></style>
