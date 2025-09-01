<template>
	<div class="transform-input" v-if="model">
		<obs-transform-data-group
			v-model="model.position"
			inner-class="flex flex-row gap-1"
			label="Position"
			local-path="position"
		>
			<obs-transform-number-input
				label="X"
				v-model="model.position.x"
				input-id="x"
				ws-prop="positionX"
				:can-template="canTemplate"
				unit="px"
				local-path="x"
			></obs-transform-number-input>
			<obs-transform-number-input
				label="Y"
				v-model="model.position.y"
				input-id="y"
				ws-prop="positionY"
				:can-template="canTemplate"
				unit="px"
				local-path="y"
			></obs-transform-number-input>
		</obs-transform-data-group>
		<obs-transform-number-input
			label="Rotation"
			v-model="model.rotation"
			input-id="rotation"
			ws-prop="rotation"
			:can-template="canTemplate"
			unit="deg"
			local-path="rotation"
		/>
		<obs-transform-enum-input
			label="Alignment"
			v-model="model.alignment"
			input-id="boundsAlignment"
			ws-prop="boundsAlignment"
			:enum="alignmentEnum"
			local-path="alignment"
		/>
		<obs-transform-data-group
			v-model="model.scale"
			inner-class="flex flex-row gap-1"
			label="Size"
			local-path="scale"
		>
			<template #before>
				<p class="text-color-secondary text-sm m-0">
					This is <i>not</i> in pixels. It is a multiplier for the default size. (1.0 will be default size)
				</p>
			</template>
			<obs-transform-number-input
				label="X"
				v-model="model.scale.x"
				input-id="x"
				ws-prop="scaleY"
				:can-template="canTemplate"
				unit="px"
				local-path="x"
			/>
			<obs-transform-number-input
				label="Y"
				v-model="model.scale.y"
				input-id="y"
				ws-prop="scaleY"
				:can-template="canTemplate"
				unit="px"
				local-path="y"
			/>
		</obs-transform-data-group>
		<obs-transform-data-group v-model="model.crop" label="Crop" local-path="crop">
			<div class="flex flex-row justify-content-center">
				<obs-transform-number-input
					label="Top"
					v-model="model.crop.top"
					input-id="top"
					ws-prop="cropTop"
					:can-template="canTemplate"
					local-path="top"
				/>
			</div>
			<div class="flex flex-row justify-content-center gap-1">
				<obs-transform-number-input
					label="Left"
					v-model="model.crop.left"
					input-id="cropLeft"
					ws-prop="cropLeft"
					:can-template="canTemplate"
					local-path="left"
				/>
				<obs-transform-number-input
					label="Right"
					v-model="model.crop.right"
					input-id="x"
					ws-prop="cropRight"
					:can-template="canTemplate"
					local-path="right"
				/>
			</div>
			<div class="flex flex-row justify-content-center">
				<obs-transform-number-input
					label="Bottom"
					v-model="model.crop.bottom"
					input-id="cropBottom"
					ws-prop="cropBottom"
					:can-template="canTemplate"
					local-path="bottom"
				/>
			</div>
		</obs-transform-data-group>
		<obs-transform-data-group label="Bounds" v-model="model.boundingBox" local-path="boundingBox">
			<obs-transform-enum-input
				label="Alignment"
				v-model="model.boundingBox.alignment"
				input-id="boundsAlignment"
				ws-prop="boundsAlignment"
				:enum="alignmentEnum"
				local-path="alignment"
			/>
			<obs-transform-enum-input
				label="Bounds Type"
				v-model="model.boundingBox.boxType"
				input-id="boundsType"
				ws-prop="boundsType"
				:enum="boundsTypeEnum"
				local-path="boxType"
			/>
			<div class="flex flex-row justify-content-center gap-1">
				<obs-transform-number-input
					label="Width"
					v-model="model.boundingBox.width"
					input-id="boundsWidth"
					ws-prop="boundsWidth"
					:can-template="canTemplate"
					local-path="width"
				/>
				<obs-transform-number-input
					label="Height"
					v-model="model.boundingBox.height"
					input-id="boundsHeight"
					ws-prop="boundsHeight"
					:can-template="canTemplate"
					local-path="height"
				/>
			</div>
		</obs-transform-data-group>
	</div>
</template>

<script setup lang="ts">
import { OBSSourceTransform, SchemaOBSSourceTransform, OBSBoundsType, OBSAlignment } from "castmate-plugin-obs-shared"
import { SharedDataInputProps, CAutocomplete, LabelFloater, useDataBinding } from "castmate-ui-core"
import { useModel, computed } from "vue"

import ObsTransformDataGroup from "./ObsTransformDataGroup.vue"
import ObsTransformNumberInput from "./ObsTransformNumberInput.vue"
import ObsTransformEnumInput from "./ObsTransformEnumInput.vue"

const props = defineProps<
	{
		modelValue: OBSSourceTransform | undefined
		schema: SchemaOBSSourceTransform
	} & SharedDataInputProps
>()

useDataBinding(() => props.localPath)

const model = useModel(props, "modelValue")

const canTemplate = computed(() => props.schema.template == true)

const alignmentEnum = computed<
	{
		name: string
		value: OBSAlignment
	}[]
>(() => {
	return [
		{ name: "Center", value: OBSAlignment.OBS_ALIGN_CENTER },
		{ name: "Left", value: OBSAlignment.OBS_ALIGN_LEFT },
		{ name: "Right", value: OBSAlignment.OBS_ALIGN_RIGHT },
		{ name: "Top", value: OBSAlignment.OBS_ALIGN_TOP },
		{ name: "Bottom", value: OBSAlignment.OBS_ALIGN_BOTTOM },
		{ name: "Top Left", value: OBSAlignment.OBS_ALIGN_TOP_LEFT },
		{ name: "Top Right", value: OBSAlignment.OBS_ALIGN_TOP_RIGHT },
		{ name: "Bottom Left", value: OBSAlignment.OBS_ALIGN_BOTTOM_LEFT },
		{ name: "Bottom Right", value: OBSAlignment.OBS_ALIGN_BOTTOM_RIGHT },
	]
})

const boundsTypeEnum = computed<{ name: string; value: OBSBoundsType }[]>(() => {
	return [
		{ name: "None", value: "OBS_BOUNDS_NONE" },
		{ name: "Stretch", value: "OBS_BOUNDS_STRETCH" },
		{ name: "Scale Inner", value: "OBS_BOUNDS_SCALE_INNER" },
		{ name: "Scale Outer", value: "OBS_BOUNDS_SCALE_OUTER" },
		{ name: "Scale to Width", value: "OBS_BOUNDS_SCALE_TO_WIDTH" },
		{ name: "Scale to Height", value: "OBS_BOUNDS_SCALE_TO_HEIGHT" },
		{ name: "Max Only", value: "OBS_BOUNDS_MAX_ONLY" },
	]
})
</script>

<style scoped>
.transform-input {
	background-color: var(--surface-a);
	padding: 0.5rem;
	border-radius: var(--border-radius);
}
</style>
