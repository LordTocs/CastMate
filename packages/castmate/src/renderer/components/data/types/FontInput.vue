<template>
	<v-select
		:items="fonts || []"
		v-model="modelObj"
		:label="props.label"
		:density="props.density"
		:menu-props="{ maxHeight: 400, location: 'bottom' }"
	>
		<template #item="{ item, props }">
			<v-list-item
				v-bind="props"
				class="d-flex flex-row justify-center py-1"
				title=""
			>
				<span
					:style="{ fontFamily: `${addQuotes(item.value)}` }"
					class="text-preview"
				>
					{{ item.value }}
				</span>
			</v-list-item>
		</template>
		<template #selection="{ item }">
			<div class="text-no-wrap">
				<span
					:style="{ fontFamily: `${addQuotes(item.value)}` }"
					class="text-preview"
				>
					{{ item.value }}
				</span>
			</div>
		</template>
	</v-select>
</template>

<script setup>
import { computed } from "vue"
import { useOSStore } from "../../../store/os"
import { useModel } from "../../../utils/modelValue"

const props = defineProps({
	modelValue: { type: String },
	label: { type: String },
	density: { type: String },
})
const emit = defineEmits(["update:modelValue"])

const osStore = useOSStore()
const fonts = computed(() => osStore.fonts.map((f) => ({ title: f, vaue: f })))

const modelObj = useModel(props, emit)

function addQuotes(str) {
	return `"${str}"`
}
</script>

<style scoped>
.text-preview {
	color: white;
}
</style>
