<template>
	<div class="p-inputgroup w-full">
		<document-path :local-path="localPath">
			<span class="p-float-label">
				<template>
					<document-path local-path="min">
						<p-input-number id="min" v-model="(model.min as number | undefined)" placeholder="-∞" />
					</document-path>
				</template>
				<label for="min"> {{ props.schema.name }} Min</label>
			</span>
			<span class="p-float-label">
				<template>
					<document-path local-path="max">
						<p-input-number id="max" v-model="(model.max as number | undefined)" placeholder="∞" />
					</document-path>
				</template>
				<label for="max"> {{ props.schema.name }} Max</label>
			</span>
		</document-path>
	</div>
</template>

<script setup lang="ts">
import PInputNumber from "primevue/inputnumber"
import { SchemaRange, SchemaBase, Range } from "castmate-schema"
import { computed, useModel } from "vue"

const props = defineProps<{
	schema: SchemaRange & SchemaBase
	modelValue: Range
	localPath?: string
}>()

const canTemplate = computed(() => !!props.schema?.template)

const model = useModel(props, "modelValue")
</script>
