<template>
	<div
		class="margin-padding-edit"
		:class="{
			'edit-both': editBoth,
			'edit-one': editOne,
		}"
	>
		<edge-edit
			class="margin-edit"
			v-model="model.margin"
			v-if="allowMargin"
			:edit-height-frac="0.23"
			:edit-width-frac="0.2"
		/>
		<edge-edit
			class="padding-edit"
			v-model="model.padding"
			v-if="allowPadding"
			:edit-height-frac="0.46"
			:edit-width-frac="0.4"
		/>
	</div>
</template>

<script setup lang="ts">
import EdgeEdit from "./EdgeEdit.vue"
import { OverlayBlockStyle, OverlayEdgeInfo } from "castmate-plugin-overlays-shared"
import { computed, ref, useModel } from "vue"

import MarginPaddingNumEdit from "./MarginPaddingNumEdit.vue"
import { useDefaulted, useDragValue } from "castmate-ui-core"

const props = withDefaults(
	defineProps<{
		modelValue:
			| {
					margin: OverlayEdgeInfo
					padding: OverlayEdgeInfo
			  }
			| undefined
		allowMargin?: boolean
		allowPadding?: boolean
	}>(),
	{
		allowMargin: true,
		allowPadding: true,
	}
)

const model = useDefaulted(useModel(props, "modelValue"), () => {
	return OverlayBlockStyle.factoryCreate()
})

const editBoth = computed(() => props.allowMargin && props.allowPadding)
const editOne = computed(() => (props.allowMargin && !props.allowPadding) || (!props.allowMargin && props.allowPadding))
</script>

<style scoped>
.margin-padding-edit.edit-both {
	position: relative;
	width: 200px;
	height: 150px;
}

.margin-padding-edit.edit-one {
	position: relative;
	width: 120px;
	height: 90px;
}

.edit-one .margin-edit {
	position: absolute;
	left: 0;
	right: 0;
	width: 100%;
	height: 100%;
}

.edit-one .padding-edit {
	position: absolute;
	left: 0;
	right: 0;
	width: 100%;
	height: 100%;
}

.edit-both .margin-edit {
	position: absolute;
	left: 0;
	right: 0;
	width: 100%;
	height: 100%;
}

.edit-both .padding-edit {
	position: absolute;
	left: 20%;
	right: 20%;
	top: 23%;
	bottom: 23%;
}
</style>
