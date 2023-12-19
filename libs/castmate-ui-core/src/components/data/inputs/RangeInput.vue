<template>
	<div class="p-inputgroup">
		<span class="force-float-label component-span">
			<span class="component-span" input-id="range">
				<document-path :local-path="localPath">
					<span class="component-span">
						<template v-if="!templateMode">
							<document-path local-path="min">
								<span class="p-inputgroup-addon left-fix"> Min </span>
								<p-input-number
									class="left-fix"
									input-id="min"
									v-model="(min as number | undefined)"
									placeholder="-∞"
								/>
							</document-path>
						</template>
					</span>
					<span class="mx-1 flex align-items-center justify-content-center">⟶</span>
					<span class="component-span">
						<template v-if="!templateMode">
							<document-path local-path="max">
								<span class="p-inputgroup-addon"> Max </span>
								<p-input-number
									class="left-fix"
									input-id="max"
									v-model="(max as number | undefined)"
									placeholder="∞"
								/>
							</document-path>
						</template>
					</span>
				</document-path>
			</span>
			<label for="range" class="force-float"> {{ props.schema.name }}</label>
		</span>
	</div>
</template>

<script setup lang="ts">
import PInputNumber from "primevue/inputnumber"
import { SchemaRange, SchemaBase, Range } from "castmate-schema"
import { computed, useModel, ref } from "vue"
import DocumentPath from "../../document/DocumentPath.vue"
import PButton from "primevue/button"
import { SharedDataInputProps } from "../DataInputTypes"

const props = defineProps<
	{
		schema: SchemaRange & SchemaBase
		modelValue: Range | undefined
	} & SharedDataInputProps
>()

const canTemplate = computed(() => !!props.schema?.template)
const templateMode = ref(false)

const min = computed({
	get() {
		return model.value?.min
	},
	set(v) {
		if (!model.value) {
			model.value = { min: v }
			return
		}
		model.value.min = v
	},
})

const max = computed({
	get() {
		return model.value?.max
	},
	set(v) {
		if (!model.value) {
			model.value = { max: v }
			return
		}
		model.value.max = v
	},
})

const model = useModel(props, "modelValue")
</script>

<style scoped>
.component-span {
	display: flex;
	align-items: stretch;
	width: 100%;
}

.force-float {
	top: -0.75rem;
	font-size: 12px;
	left: 0.75rem;
	color: #b3b3b3;
	position: absolute;
	pointer-events: none;
	margin-top: -0.5rem;
	transition-property: all;
	transition-timing-function: ease;
	line-height: 1;
}

.force-float-label {
	position: relative;
}
.left-fix :deep(input) {
	border-top-left-radius: 0 !important;
	border-bottom-left-radius: 0 !important;
}
</style>
