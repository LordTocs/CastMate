<template>
	<div>
		<label-floater label="Name" v-slot="labelProps">
			<midi-device-name-autocomplete
				v-model="model.midiDeviceName"
				:direction="direction"
				v-bind="labelProps"
				local-path="midiDeviceName"
			/>
		</label-floater>
	</div>
</template>

<script setup lang="ts">
import { MidiPortConfig, MidiPortState } from "castmate-plugin-midi-shared"
import { CToggleButton, CTextInput, LabelFloater, useDataBinding } from "castmate-ui-core"
import { computed, ref } from "vue"
import MidiDeviceNameAutocomplete from "./MidiDeviceNameAutocomplete.vue"
const props = defineProps<{
	direction: "input" | "output"
}>()
const model = defineModel<MidiPortConfig>({ required: true })
</script>
