<template>
	<div>
		<div class="flex flex-row">
			<c-dropdown
				v-model="status"
				:options="statusOptions"
				option-value="code"
				option-label="name"
				local-path="status"
			></c-dropdown>
			<c-number-input v-model="subStatus" local-path="subStatus"> </c-number-input>
			<c-number-input v-model="data1" local-path="subStatus"> </c-number-input>
			<c-number-input v-model="data2" local-path="subStatus"> </c-number-input>
		</div>
	</div>
</template>

<script setup lang="ts">
import { MidiMessage, MidiStatuses, SchemaMidiMessage } from "castmate-plugin-midi-shared"
import { SharedDataInputProps, useDataBinding, useDefaultableModel } from "castmate-ui-core"
import { CNumberInput, CDropdown } from "castmate-ui-core"
import { MenuItem } from "primevue/menuitem"
import { computed } from "vue"

const model = defineModel<MidiMessage>()

const props = defineProps<
	{
		schema: SchemaMidiMessage
	} & SharedDataInputProps
>()

useDataBinding(() => props.localPath)

const statusOptions = computed<MenuItem[]>(() => {
	return Object.keys(MidiStatuses).map((k) => ({
		code: MidiStatuses[k as keyof typeof MidiStatuses],
		name: k,
	}))
})

const status = useDefaultableModel(model, "status", MidiStatuses["Control"], () => MidiMessage.factoryCreate())
const subStatus = useDefaultableModel(model, "subStatus", 0, () => MidiMessage.factoryCreate())
const data1 = useDefaultableModel(model, "data1", 0, () => MidiMessage.factoryCreate())
const data2 = useDefaultableModel(model, "data2", 0, () => MidiMessage.factoryCreate())
</script>
