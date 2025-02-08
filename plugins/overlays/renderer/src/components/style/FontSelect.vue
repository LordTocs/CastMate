<template>
	<label-floater :label="label" :input-id="inputId" v-slot="labelProps">
		<p-select class="w-full" v-model="undoModel" :options="fontNames" v-bind="labelProps">
			<template #option="{ option }: { option: string }">
				<span :style="{ fontFamily: option }">{{ option }}</span>
			</template>

			<template #value="{ value }: { value: string }">
				<span :style="{ fontFamily: value }">{{ value }}</span>
			</template>
		</p-select>
	</label-floater>
</template>

<script setup lang="ts">
import PSelect from "primevue/select"
import { getFonts } from "font-list"
import { computed, onMounted, ref, useModel } from "vue"
import { LabelFloater, useDataBinding, useUndoCommitter } from "castmate-ui-core"

const props = defineProps<{
	modelValue: string | undefined
	label?: string
	inputId?: string
	localPath?: string
}>()

const model = useModel(props, "modelValue")

useDataBinding(() => props.localPath)

const undoModel = useUndoCommitter(model)

const fontNames = ref<string[]>([])

onMounted(async () => {
	fontNames.value = await getFonts()
})
</script>
