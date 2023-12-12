<template>
	<div class="p-inputgroup">
		<template v-if="schema.enum">
			<document-path :local-path="localPath"> </document-path>
		</template>
		<template v-else>
			<document-path :local-path="localPath">
				<div style="flex: 1">
					<label-floater :label="schema.name ?? ''" :no-float="!!noFloat" input-id="text" v-slot="labelProps">
						<template-toggle
							v-model="model"
							:template-mode="templateMode"
							v-bind="labelProps"
							v-slot="templateProps"
						>
							<p-input-number
								v-model="(model as number | undefined)"
								:min="min"
								:max="max"
								:step="step"
								:suffix="unit"
								:format="false"
								v-bind="templateProps"
								v-if="!schema.enum"
							/>
							<enum-input
								v-else
								:schema="schema"
								v-model="model"
								:no-float="!!noFloat"
								:context="context"
								v-bind="templateProps"
							/>
						</template-toggle>
					</label-floater>
					<p-slider
						v-if="schema.slider && !templateMode"
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
import EnumInput from "../base-components/EnumInput.vue"
import { SharedDataInputProps } from "../DataInputTypes"
import TemplateToggle from "../base-components/TemplateToggle.vue"

const props = defineProps<
	{
		schema: SchemaNumber & SchemaBase
		modelValue: number | string | undefined
		localPath?: string
	} & SharedDataInputProps
>()

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
