<template>
	<div class="p-inputgroup" @mousedown="stopPropagation">
		<document-path :local-path="localPath">
			<label-floater
				:label="schema.name"
				:no-float="noFloat"
				input-id="text"
				v-slot="labelProps"
				v-if="!schema.enum"
			>
				<template-toggle
					v-model="model"
					:template-mode="schema.template ?? false"
					v-bind="labelProps"
					v-slot="templateProps"
					:error-message="errorMessage"
				>
					<p-password
						v-model="model"
						v-bind="templateProps"
						:class="{ 'p-invalid': errorMessage }"
						v-if="secret"
						toggle-mask
						:feedback="false"
					/>
					<enum-input
						:schema="schema"
						v-model="model"
						:context="context"
						v-bind="templateProps"
						v-else-if="schema.enum"
						:error-message="errorMessage"
					/>
					<p-input-text
						v-model="model"
						:class="{ 'p-invalid': errorMessage }"
						v-bind="templateProps"
						v-else
					/>
					<div class="flex flex-row">
						<error-label :error-message="errorMessage" />
					</div>
				</template-toggle>
			</label-floater>
		</document-path>
		<!-- <span v-if="schema.template" class="p-inputgroup-addon" style="width: 2.857rem">
			<i class="mdi mdi-code-braces flex-none" />
		</span> -->
		<p-button class="flex-none" v-if="!schema.required" icon="pi pi-times" @click.stop="clear" />
	</div>
</template>

<script setup lang="ts">
import PInputText from "primevue/inputtext"
import PPassword from "primevue/password"
import PButton from "primevue/button"
import { type SchemaString, type SchemaBase } from "castmate-schema"
import { useVModel } from "@vueuse/core"
import DocumentPath from "../../document/DocumentPath.vue"
import { SharedDataInputProps } from "../DataInputTypes"
import LabelFloater from "../base-components/LabelFloater.vue"
import { TemplateToggle, stopPropagation } from "../../../main"
import EnumInput from "../base-components/EnumInput.vue"
import { useValidator } from "../../../util/validation"
import ErrorLabel from "../base-components/ErrorLabel.vue"

const props = defineProps<
	{
		schema: SchemaString & SchemaBase
		modelValue: string | undefined
	} & SharedDataInputProps
>()

const emit = defineEmits(["update:modelValue"])

function clear() {
	model.value = undefined
}

const model = useVModel(props, "modelValue", emit)

const errorMessage = useValidator(model, () => props.schema)
</script>
