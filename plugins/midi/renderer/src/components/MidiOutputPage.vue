<template>
	<scrolling-tab-body v-model:scroll-x="scrollX" v-model:scroll-y="scrollY" inner-class="p-1">
		<midi-device v-model="model" direction="input"></midi-device>
	</scrolling-tab-body>
</template>

<script setup lang="ts">
import { MidiPageData } from "../midi-device-page-types"
import { ScrollingTabBody, viewRef } from "castmate-ui-core"
import MidiDevice from "./MidiDevice.vue"
import { MidiPortConfig } from "castmate-plugin-midi-shared"

const model = defineModel<MidiPortConfig>({ required: true })

const props = defineProps<{
	pageData: { documentId: string }
}>()

const scrollX = viewRef<number>("scrollX")
const scrollY = viewRef<number>("scrollY")
</script>
