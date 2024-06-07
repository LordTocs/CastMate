<template>
	<label-floater :label="label" :input-id="inputId" v-slot="labelProps">
		<p-dropdown class="w-full" v-model="model" :options="fontNames" v-bind="labelProps">
			<template #option="{ option }: { option: string }">
				<span :style="{ fontFamily: option }">{{ option }}</span>
			</template>

			<template #value="{ value }: { value: string }">
				<span :style="{ fontFamily: value }">{{ value }}</span>
			</template>
		</p-dropdown>
	</label-floater>
</template>

<script setup lang="ts">
import PDropdown from "primevue/dropdown"
import { getFonts } from "font-list"
import { computed, onMounted, ref, useModel } from "vue"
import { LabelFloater } from "castmate-ui-core"

const props = defineProps<{
	modelValue: string | undefined
	label?: string
	inputId?: string
}>()

const model = useModel(props, "modelValue")

const fontNames = ref<string[]>([])

onMounted(async () => {
	fontNames.value = await getFonts()
})
</script>
