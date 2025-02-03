<template>
	<div class="command-value">
		<div class="command-value-header flex flex-row align-items-center">
			<i class="mdi mdi-drag command-drag-handle" style="font-size: 1.4rem" />
			<div class="flex-grow-1" />
			<p-button text size="small" icon="mdi mdi-delete" @click="emit('delete')"></p-button>
		</div>
		<div class="p-1">
			<label-floater :no-float="true" label="Name" input-id="type" v-slot="labelProps">
				<variable-name-input v-model="model.name" v-bind="labelProps" style="width: 100%" local-path="name" />
			</label-floater>
			<label-floater :no-float="true" label="Type" input-id="type" v-slot="labelProps">
				<c-dropdown
					v-bind="labelProps"
					v-model="model.schema.type"
					:options="argTypeOptions"
					option-value="code"
					option-label="name"
					style="width: 100%"
					class="mt-1"
					local-path="schema.type"
				/>
			</label-floater>
		</div>
	</div>
</template>

<script setup lang="ts">
import type { MenuItem } from "primevue/menuitem"
import { computed, useModel } from "vue"
import { getAllCommandArgTypes, CommandArgument } from "castmate-schema"
import PDropdown from "primevue/dropdown"
import LabelFloater from "../LabelFloater.vue"
import VariableNameInput from "../VariableNameInput.vue"
import PButton from "primevue/button"
import CDropdown from "../CDropdown.vue"
import { useDataBinding } from "../../../../main"

const props = defineProps<{
	modelValue: CommandArgument
	localPath: string
}>()

useDataBinding(() => props.localPath)

const model = useModel(props, "modelValue")

const emit = defineEmits(["update:modelValue", "delete"])

const argTypes = computed(() => {
	return getAllCommandArgTypes().map((t) => t.name)
})

const argTypeOptions = computed<MenuItem[]>(() => {
	return argTypes.value.map((v) => ({
		code: v,
		name: v,
	}))
})
</script>

<style scoped>
.command-value {
	border: solid 1px var(--surface-border);
	border-radius: var(--border-radius);
}

.command-value-header {
	border-top-right-radius: var(--border-radius);
	border-top-left-radius: var(--border-radius);

	background-color: var(--surface-b);
}
</style>
