<template>
	<pan-area class="automation-edit grid-paper" v-model:panState="panState" zoom-y="false">
		<sequence-edit v-model="testSeq" :floating="false" />
	</pan-area>
</template>

<script setup lang="ts">
import { provide, ref } from "vue"
import { type Sequence } from "castmate-schema"
import ActionElement from "./ActionElement.vue"
import { ActionInfo } from "castmate-schema"
import { useEventListener } from "@vueuse/core"
import { PanArea } from "castmate-ui-core"
import SequenceEdit from "./SequenceEdit.vue"

const props = defineProps<{
	modelValue: Sequence
}>()

const emit = defineEmits(["update:modelValue"])
const zoom = ref(1)
const editArea = ref<HTMLElement | undefined>(undefined)

provide("pan-area", editArea)

const panState = ref({
	panX: 0,
	panY: 0,
	zoomX: 1,
	zoomY: 1,
	panning: false,
})

const testSeq = ref<Sequence>({
	actions: [
		{
			id: "acb",
			plugin: "castmate",
			action: "delay",
			config: {
				duration: 1.5,
			},
			offsets: [],
		},
		{
			id: "cad",
			plugin: "castmate",
			action: "blah",
			config: {},
		},
		{
			id: "acb",
			plugin: "castmate",
			action: "tts",
			config: {
				duration: 3,
			},
			offsets: [
				{
					id: "fff",
					offset: 1.0,
					actions: [
						{
							id: "ytg",
							plugin: "castmate",
							action: "blah",
							config: {},
						},
					],
				},
			],
		},
		{
			id: "cde",
			stack: [
				{
					id: "def",
					plugin: "castmate",
					action: "blah",
					config: {},
				},
				{
					id: "efg",
					plugin: "castmate",
					action: "blah",
					config: {},
				},
			],
		},
	],
})

const test = ref<ActionInfo>({
	id: "acb",
	plugin: "castmate",
	action: "delay",
	config: {
		duration: 1.5,
	},
})

const test2 = ref<ActionInfo>({
	id: "cad",
	plugin: "castmate",
	action: "blah",
	config: {},
})
</script>

<style scoped>
.automation-edit {
	--timeline-height: 120px;
	--point-size: 15px;
	--instant-width: 120px;
	--time-handle-height: 15px;
	--time-handle-width: 15px;
	--time-width: calc(var(--zoom-x) * 40px);

	width: 100%;
	height: 100%;
}

.grid-paper {
	background: linear-gradient(-90deg, var(--surface-d) 1px, transparent 1px),
		linear-gradient(0deg, var(--surface-d) 1px, transparent 1px);
	background-size: calc(var(--zoom-x) * 40px) var(--timeline-height),
		calc(var(--zoom-x) * 40px) var(--timeline-height);
	background-position-x: var(--pan-x), 0;
	background-position-y: 0, var(--pan-y);
}

.panning {
	cursor: move;
}
</style>
