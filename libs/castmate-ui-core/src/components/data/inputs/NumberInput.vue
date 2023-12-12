<template>
	<div class="p-inputgroup" v-bind="$attrs">
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
							:class="{ 'p-invalid': errorMessage }"
							v-if="!schema.enum"
						/>
						<enum-input
							v-else
							:schema="schema"
							v-model="model"
							:no-float="!!noFloat"
							:context="context"
							v-bind="templateProps"
							:error-message="errorMessage"
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
		<p-button
			v-if="canTemplate"
			class="flex-none"
			icon="mdi mdi-code-braces"
			@click="templateMode = !templateMode"
		/>
		<p-button v-if="!schema.required" class="flex-none" icon="pi pi-times" @click="clear" />
	</div>
	<error-label :error-message="errorMessage" />
</template>

<script setup lang="ts">
import PInputText from "primevue/inputtext"
import PInputNumber from "primevue/inputnumber"
import PButton from "primevue/button"
import PSlider from "primevue/slider"
import { type SchemaBase, type SchemaNumber } from "castmate-schema"
import { useVModel } from "@vueuse/core"
import { computed, ref, onMounted, useModel } from "vue"
import DocumentPath from "../../document/DocumentPath.vue"
import LabelFloater from "../base-components/LabelFloater.vue"
import EnumInput from "../base-components/EnumInput.vue"
import { SharedDataInputProps } from "../DataInputTypes"
import TemplateToggle from "../base-components/TemplateToggle.vue"
import ErrorLabel from "../base-components/ErrorLabel.vue"
import { useValidator } from "../../../util/validation"

const props = defineProps<
	{
		schema: SchemaNumber & SchemaBase
		modelValue: number | string | undefined
		localPath?: string
	} & SharedDataInputProps
>()

const lazyNumberData = ref(null)

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

const model = useModel(props, "modelValue")

const errorMessage = useValidator(model, () => props.schema)
</script>
