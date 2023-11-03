<template>
	<div class="light-action">
		<div
			v-if="props.modelValue.on === true || props.modelValue.on == 'toggle'"
			class="gradient on"
			:class="{ toggle: props.modelValue.on == 'toggle' }"
			:style="{ background: onGradient }"
		></div>
		<div
			v-if="props.modelValue.on === false || props.modelValue.on == 'toggle'"
			class="gradient off"
			:class="{ toggle: props.modelValue.on == 'toggle' }"
			:style="{ background: offGradient }"
		></div>
		<i :class="icon" style="position: relative; font-size: 1.5rem" />
	</div>
</template>

<script setup lang="ts">
import { LightColor } from "castmate-plugin-iot-shared"
import { Toggle } from "castmate-schema"
import { computed } from "vue"

const props = defineProps<{
	modelValue: { lightColor: LightColor; on: Toggle }
}>()

const lightColor = computed(() => {
	return LightColor.toColor(props.modelValue.lightColor)
})

const offColor = computed(() => "#000000")

//trueIcon: "mdi-lightbulb-on",
//falseIcon: "mdi-lightbulb-outline",

const icon = computed(() => {
	if (props.modelValue.on === true) {
		return "mdi mdi-lightbulb-on"
	} else if (props.modelValue.on === false) {
		return "mdi mdi-lightbulb-outline"
	}
	return "mdi mdi-swap-horizontal"
})

const onGradient = computed(() => {
	return `linear-gradient(90deg, ${offColor.value} 0%, ${lightColor.value} 100%)`
})

const offGradient = computed(() => {
	return `linear-gradient(90deg, ${lightColor.value} 0%, ${offColor.value} 100%)`
})
</script>

<style scoped>
.gradient {
	position: absolute;
	left: 0;
	right: 0;
	top: 0;
	bottom: 0;
}

.on.toggle {
	clip-path: polygon(0% 0%, 100% 100%, 0% 100%);
}

.off.toggle {
	clip-path: polygon(0% 0%, 100% 100%, 100% 0%);
}

.light-action {
	display: flex;
	flex-direction: row;
	align-items: center;
	justify-content: center;
	overflow: hidden;
}
</style>
