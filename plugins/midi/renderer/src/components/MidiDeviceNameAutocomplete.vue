<template>
	<c-autocomplete
		v-model="model"
		:items="items"
		:placeholder="placeholder"
		:disabled="disabled"
		@open="queryDevices"
		text-prop="id"
	>
	</c-autocomplete>
</template>

<script setup lang="ts">
import { JZZPortInfo } from "castmate-plugin-midi-shared"
import { CAutocomplete, useDataBinding, useIpcCaller } from "castmate-ui-core"
import { computed, ref } from "vue"

const model = defineModel<string>()

const props = defineProps<{
	placeholder?: string
	localPath?: string
	disabled?: boolean
	direction: "input" | "output"
}>()

const deviceNames = ref<JZZPortInfo[]>([])

const getInputs = useIpcCaller<() => JZZPortInfo[]>("midi", "getInputs")
const getOutputs = useIpcCaller<() => JZZPortInfo[]>("midi", "getOUtputs")

const items = computed<{ id: string }[]>(() => {
	return deviceNames.value.map((i) => ({ id: i.name }))
})

async function queryDevices() {
	deviceNames.value = await (props.direction == "input" ? getInputs : getOutputs)()
}

useDataBinding(() => props.localPath)
</script>
