<template>
	<div class="p-inputgroup obs-transform-enum">
		<label-floater :label="label" :input-id="inputId" v-slot="labelProps">
			<c-autocomplete v-model="model" v-bind="labelProps" :required="false" text-prop="name" :items="items" />
		</label-floater>
	</div>
</template>

<script setup lang="ts" generic="T">
import { OBSWSSourceTransform } from "castmate-plugin-obs-shared"
import { LabelFloater, CAutocomplete, useDataBinding } from "castmate-ui-core"
import { useModel, computed } from "vue"

const props = defineProps<{
	modelValue: T | undefined
	label?: string
	inputId: string
	wsProp: keyof OBSWSSourceTransform
	enum: { name: string; value: T }[]
	localPath: string
}>()

useDataBinding(() => props.localPath)

const items = computed(() => {
	return props.enum.map((e) => ({ name: e.name, id: e.value }))
})

const model = useModel(props, "modelValue")
</script>

<style scoped>
.obs-transform-enum {
	margin-top: 1.5rem;
}
</style>
