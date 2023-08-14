<template>
	<document-path :local-path="localPath">
		<div class="toggler" :class="{ [`toggle-${modelValue ?? false}`]: true }">
			<div class="section-false" @click="modelObj = false"></div>
			<div class="section-toggle" @click="modelObj = 'toggle'"></div>
			<div class="section-true" @click="modelObj = true"></div>
			<div class="toggle-ball" @click="cycleInput"></div>
		</div>
	</document-path>
</template>

<script setup lang="ts">
import { Toggle } from "castmate-schema"
import { useModel } from "vue"
import DocumentPath from "../../document/DocumentPath.vue"

const props = defineProps<{
	modelValue: Toggle
	localPath?: string
}>()

const modelObj = useModel(props, "modelValue")

function cycleInput(ev: MouseEvent) {
	if (!props.modelValue) {
		modelObj.value = "toggle"
	} else if (props.modelValue === "toggle") {
		modelObj.value = true
	} else if (props.modelValue === true) {
		modelObj.value = false
	}
	ev.preventDefault()
	ev.stopPropagation()
}
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

.toggler.toggle-true {
	background: var(--primary-color);
}

.toggler.toggle-toggle {
	background: var(--secondary-color);
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
