<template>
	<data-input-base v-model="model" :schema="schema" :toggle-template="false">
		<template #prepend>
			<duration-field v-model="durationModel" style="width: 5rem" />
		</template>

		<template #default="inputProps">
			<p-dropdown v-model="presetModel" :options="presetOptions" class="w-full" v-bind="inputProps"></p-dropdown>
		</template>
	</data-input-base>
</template>

<script setup lang="ts">
import { SharedDataInputProps, DataInputBase } from "castmate-ui-core"
import { OverlayTransitionAnimation, SchemaOverlayTransitionAnimation } from "castmate-plugin-overlays-shared"
import { computed, useModel } from "vue"

import PInputNumber from "primevue/inputnumber"
import PDropdown from "primevue/dropdown"
import { revealers } from "castmate-overlay-core"
import { DurationField } from "castmate-ui-core"

const props = defineProps<
	{
		modelValue: OverlayTransitionAnimation | undefined
		schema: SchemaOverlayTransitionAnimation
	} & SharedDataInputProps
>()

const model = useModel(props, "modelValue")

const presetModel = computed({
	get() {
		if (!props.modelValue) return undefined
		return props.modelValue.preset
	},
	set(v) {
		if (!v) {
			model.value = undefined
			return
		}

		if (!model.value) {
			model.value = {
				duration: 1,
				preset: v,
			}
		} else {
			model.value.preset = v
		}
	},
})

const durationModel = computed({
	get() {
		if (!props.modelValue) return undefined
		return props.modelValue.duration
	},
	set(v) {
		if (v == null) {
			model.value = undefined
			return
		}

		if (!model.value) {
			model.value = {
				duration: v,
				preset: "None",
			}
		} else {
			model.value.duration = v
		}
	},
})

const presetOptions = computed(() => Object.keys(revealers))
</script>
