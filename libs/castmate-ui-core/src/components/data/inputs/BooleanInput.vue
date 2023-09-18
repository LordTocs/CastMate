<template>
	<document-path :local-path="localPath">
		<div class="p-inputgroup w-full" v-bind="$attrs">
			<p-check-box binary input-id="check" v-model="model" />
			<label for="check" class="ml-2" v-if="schema.name"> {{ schema.name }} </label>
		</div>
	</document-path>
</template>

<script setup lang="ts">
import { SchemaBoolean } from "castmate-schema"
import DocumentPath from "../../document/DocumentPath.vue"
import PCheckBox from "primevue/checkbox"
import { useModel } from "vue"

const props = defineProps<{
	modelValue: boolean
	schema: SchemaBoolean
	localPath?: string
}>()

const model = useModel(props, "modelValue")
</script>

<style scoped>
.data-prop {
	margin-top: 0.5rem !important;
}

.data-prop:nth-child(1) {
	margin-top: 0 !important;
}
</style>
