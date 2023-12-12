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
				>
					<p-password v-model="model" v-bind="templateProps" v-if="secret" toggle-mask :feedback="false" />
					<enum-input
						:schema="schema"
						v-model="model"
						:context="context"
						v-bind="templateProps"
						v-else-if="schema.enum"
					/>
					<p-input-text v-model="model" v-bind="templateProps" v-else />
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
</script>
