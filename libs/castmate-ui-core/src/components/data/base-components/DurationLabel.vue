<template>
	{{ label }}
</template>

<script setup lang="ts">
import { Duration } from "castmate-schema"
import { computed } from "vue"

const HOUR_DUR = 60 * 60
const MINUTE_DUR = 60

const props = defineProps<{
	modelValue: Duration | undefined
}>()

const label = computed(() => {
	if (props.modelValue == null) {
		return ""
	}

	let hours = 0
	let minutes = 0
	let seconds = 0

	let remaining = props.modelValue as number
	if (remaining > HOUR_DUR) {
		hours = Math.floor(remaining / HOUR_DUR)
		remaining = remaining % HOUR_DUR
	}
	if (remaining > MINUTE_DUR) {
		minutes = Math.floor(remaining / MINUTE_DUR)
		remaining = remaining % MINUTE_DUR
	}
	seconds = remaining

	let result = ""
	if (hours > 0) {
		result += hours + "h "

		result +=
			minutes.toLocaleString("en-Us", {
				minimumIntegerDigits: 2,
				useGrouping: false,
			}) + "m "

		result +=
			seconds.toLocaleString("en-Us", {
				minimumIntegerDigits: 2,
				useGrouping: false,
			}) + "s"
	} else if (minutes > 0) {
		result += minutes + "m "

		result +=
			seconds.toLocaleString("en-Us", {
				minimumIntegerDigits: 2,
				useGrouping: false,
			}) + "s"
	} else {
		result += seconds + "s"
	}

	return result
})

function parseFromModel() {}
</script>
