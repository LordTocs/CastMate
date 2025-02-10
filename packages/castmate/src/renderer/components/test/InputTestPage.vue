<template>
	<scrolling-tab-body ref="body">
		<div class="flex flex-row">
			<div style="width: 50%; flex-shrink: 0">
				<data-input :schema="baseTestSchema" v-model="baseDataBinding.rootData" local-path="" />
			</div>
			<data-binding-debugger :binding="baseDataBinding" />
		</div>
	</scrolling-tab-body>
</template>

<script setup lang="ts">
import {
	Color,
	Duration,
	Timer,
	FilePath,
	Range,
	Directory,
	Toggle,
	declareSchema,
	MediaFile,
	constructDefault,
} from "castmate-schema"
import {
	ScrollingTabBody,
	useDataInputStore,
	DataInputBase,
	DataInput,
	ResourceProxyFactory,
	DataBinding,
	provideBaseDataBinding,
	DataBindingDebugger,
	createUndoStack,
} from "castmate-ui-core"
import { onBeforeMount, onMounted, ref } from "vue"
import util from "util"
import { TwitchCategory, TwitchViewer, TwitchViewerGroup } from "castmate-plugin-twitch-shared"
import { LightColor } from "castmate-plugin-iot-shared"
import { KeyCombo, KeyboardKey } from "castmate-plugin-input-shared"

import PInputText from "primevue/inputtext"
import PButton from "primevue/button"
import { Command } from "castmate-schema"
import { PowerShellCommand } from "castmate-plugin-os-shared"
import { OBSSourceTransform } from "castmate-plugin-obs-shared"

const testSchema = declareSchema({
	type: String,
	name: "New Base Test",
	template: true,
})

const baseDataBinding = ref<DataBinding>({
	rootView: {
		data: {},
		subPaths: {},
		uiBindings: [],
		refCount: 1,
	},
	rootData: {},
	undoStack: createUndoStack({}),
})

provideBaseDataBinding(baseDataBinding.value)

onBeforeMount(async () => {
	baseDataBinding.value.rootData = await constructDefault(baseTestSchema)
	baseDataBinding.value.undoStack = createUndoStack(baseDataBinding.value.rootData)
})

const baseTestSchema = declareSchema({
	type: Object,
	properties: {
		str: { type: String, name: "String", template: true },
		strEnum: { type: String, name: "String Enum", enum: ["hello", "goodbye", "meh", "what?"] },
		num: { type: Number, name: "Number", template: true },
		numReq: { type: Number, name: "Number Req", required: true },
		numSlider: { type: Number, min: 0, max: 100, step: 1, slider: true, name: "Num Slider", template: true },
		range: { type: Range, name: "Range", template: true },
		color: { type: Color, name: "Color", template: true },
		bool: { type: Boolean, name: "Boolean" },
		toggle: { type: Toggle, name: "Toggle", template: true },
		duration: { type: Duration, name: "Duration", template: true },
		timer: { type: Timer, name: "Timer" },
		media: { type: MediaFile, name: "MediaFile" },
		directory: { type: Directory, name: "Directory", template: true },
		filepath: { type: FilePath, name: "FilePath", template: true },
		viewer: { type: TwitchViewer, name: "Viewer", template: true },
		viewerGroup: { type: TwitchViewerGroup, name: "Viewer Group" },
		category: { type: TwitchCategory, name: "Category", template: true },
		lightColor: { type: LightColor, name: "LightColor", template: true },
		keyboardKey: { type: KeyboardKey, name: "Key" },
		keyCombo: { type: KeyCombo, name: "Key Combo" },
		array: { type: Array, items: { type: String, name: "Array String" }, name: "Array" },
		resource: { type: ResourceProxyFactory, resourceType: "ActionQueue", name: "Resource" },
		command: { type: Command, name: "Command Test", required: true, template: true },
		powershellCommand: { type: PowerShellCommand, name: "PowerShellCommand", template: true },
		obsTransform: { type: OBSSourceTransform, name: "Source Transform", template: true, required: true },
	},
})

const body = ref<InstanceType<typeof ScrollingTabBody>>()
</script>

<style scoped></style>
