<template>
	<div class="toggler" :class="{ [`toggle-${modelValue ?? false}`]: true }">
		<div class="section-false" @click="model = false"></div>
		<div class="section-toggle" @click="model = 'toggle'"></div>
		<div class="section-true" @click="model = true"></div>
		<div class="toggle-ball" @click="cycleInput">
			<i class="toggle-icon" :class="icon" style="color: black" />
		</div>
	</div>
</template>

<script setup lang="ts">
import { Toggle } from "castmate-schema"
import { useModel, computed } from "vue"

const props = withDefaults(
	defineProps<{
		modelValue: Toggle
		localPath?: string
		trueIcon?: string
		toggleIcon?: string
		falseIcon?: string
	}>(),
	{
		trueIcon: "pi pi-check",
		falseIcon: "pi pi-times",
		toggleIcon: "mdi mdi-swap-horizontal",
	}
)

const model = useModel(props, "modelValue")

function cycleInput(ev: MouseEvent) {
	if (!props.modelValue) {
		model.value = "toggle"
	} else if (props.modelValue === "toggle") {
		model.value = true
	} else if (props.modelValue === true) {
		model.value = false
	}
	ev.preventDefault()
	ev.stopPropagation()
}

const icon = computed(() => {
	if (model.value === true) {
		return props.trueIcon
	} else if (model.value === false) {
		return props.falseIcon
	} else {
		return props.toggleIcon
	}
})
</script>

<style scoped>
.toggler {
	background-color: #3c3c3c;
	transition: background-color 0.3s, color 0.3s, border-color 0.3s, box-shadow 0.3s;
	border-radius: 6px;
	width: 4.5rem;
	height: 1.75rem;
	position: relative;
}

.toggle-ball {
	position: absolute;
	top: 0.25rem;
	height: 1.25rem;
	width: 1.25rem;
	background-color: #b3b3b3;
	border-radius: 6px;
	transition-duration: 0.3s;
	display: flex;
	align-items: center;
	justify-content: center;
}

.toggle-false .toggle-ball {
	left: 0.25rem;
}

.toggle-toggle .toggle-ball {
	left: calc(0.25rem + 1.25rem + 0.25rem);
	background-color: #e6e6e6;
}

.toggle-true .toggle-ball {
	left: calc(0.25rem + 1.25rem + 0.25rem + 1.25rem);
	background-color: #e6e6e6;
}
/* 
.toggler.toggle-true {
	background: var(--primary-color);
}

.toggler.toggle-toggle {
	background: var(--secondary-color);
} */

.toggle-icon {
	font-size: 14px;
}

.section-false {
	width: 1.5rem;
	height: 100%;
	position: absolute;
	left: 0;
}

.section-toggle {
	width: 1.5rem;
	height: 100%;
	position: absolute;
	left: 1.5rem;
}

.section-true {
	width: 1.5rem;
	height: 100%;
	position: absolute;
	left: 3rem;
}
</style>
