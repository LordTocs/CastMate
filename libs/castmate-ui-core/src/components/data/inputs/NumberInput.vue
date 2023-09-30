<template>
	<div class="p-inputgroup w-full">
		<template v-if="templateMode">
			<document-path :local-path="localPath">
				<label-floater :label="schema.name ?? ''" :float="true" input-id="text" v-slot="labelProps">
					<p-input-text id="l" v-model="(model as string | undefined)" v-bind="labelProps" />
				</label-floater>
			</document-path>
		</template>
		<template v-else>
			<document-path :local-path="localPath">
				<div class="w-full">
					<label-floater :label="schema.name ?? ''" :float="true" input-id="text" v-slot="labelProps">
						<p-input-number
							v-model="(model as number | undefined)"
							:min="min"
							:max="max"
							:step="step"
							:suffix="unit"
							:format="false"
							v-bind="labelProps"
						/>
					</label-floater>
					<p-slider
						v-if="schema.slider"
						v-model="(model as number | undefined)"
						:min="min"
						:max="max"
						:step="step"
					/>
				</div>
			</document-path>
		</template>
		<p-button
			v-if="canTemplate"
			class="flex-none"
			icon="mdi mdi-code-braces"
			@click="templateMode = !templateMode"
		/>
		<p-button v-if="!schema.required" class="flex-none" icon="pi pi-times" @click="clear" />
	</div>
</template>

<script setup lang="ts">
import PInputText from "primevue/inputtext"
import PInputNumber from "primevue/inputnumber"
import PButton from "primevue/button"
import PSlider from "primevue/slider"
import { type SchemaBase, type SchemaNumber } from "castmate-schema"
import { useVModel } from "@vueuse/core"
import { computed, ref, onMounted } from "vue"
import DocumentPath from "../../document/DocumentPath.vue"
import LabelFloater from "../base-components/LabelFloater.vue"

const props = defineProps<{
	schema: SchemaNumber & SchemaBase
	modelValue: number | string | undefined
	localPath?: string
}>()

const lazyNumberData = ref(null)

const numberModel = computed({
	get() {
		return props.modelValue
	},
	set(value) {
		if (value == null || String(value).trim() == "") {
			return clear()
		}
		emit("update:modelValue", value)
	},
})

const emit = defineEmits(["update:modelValue"])

const isSlider = computed(() => props.schema?.slider ?? false)
const min = computed(() => props.schema?.min ?? (isSlider.value ? 0 : undefined))
const max = computed(() => props.schema?.max ?? (isSlider.value ? 100 : undefined))
const step = computed(() => props.schema?.step ?? (isSlider.value ? 1 : undefined))
const unit = computed(() => props.schema?.unit)

const templateMode = ref(false)
const canTemplate = computed(() => !!props.schema?.template)

const isValueNumber = computed(() => {
	if (props.modelValue == null) return true

	return !isNaN(Number(props.modelValue))
})

onMounted(() => {
	templateMode.value = !isValueNumber.value
	//lazyNumberData.value = props.modelValue != null ? String(props.modelValue) : ""
})

function clear() {
	model.value = undefined
}

const model = useVModel(props, "modelValue", emit)
</script>
