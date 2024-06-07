<template>
	<scrolling-tab-body>
		<div class="flex flex-row">
			<div style="width: 350px; flex-shrink: 0">
				<data-input :schema="baseTestSchema" v-model="testData" />
			</div>
			<div class="flex-grow-1 flex-shrink-0">
				<pre>{{
					util.inspect(testData, {
						depth: 10,
						compact: false,
					})
				}}</pre>
			</div>
		</div>
	</scrolling-tab-body>
</template>

<script setup lang="ts">
import { Color, Duration, Timer, FilePath, Range, Directory, Toggle, declareSchema, MediaFile } from "castmate-schema"
import { ScrollingTabBody, useDataInputStore, DataInputBase, DataInput, ResourceProxyFactory } from "castmate-ui-core"
import { ref } from "vue"
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
const baseDataTest = ref<any>(undefined)

const testData = ref({})

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
		toggle: { type: Toggle, name: "Toggle" },
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
		obsTransform: { type: OBSSourceTransform, name: "Source Transform", template: true },
	},
})
</script>

<style scoped></style>
