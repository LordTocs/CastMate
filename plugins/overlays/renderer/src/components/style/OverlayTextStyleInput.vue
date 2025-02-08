<template>
	<div>
		<div class="flex flex-row">
			<div class="p-inputgroup" style="flex-grow: 1; flex-shrink: 1">
				<label-floater :label="schema.name" v-slot="labelProps">
					<div class="container w-full" ref="container" v-bind="labelProps">
						<input-box class="clickable-input" :model="model" @click="openEdit">
							<span v-if="model" :style="previewStyle">{{ model.fontFamily }}</span>
						</input-box>
					</div>
					<drop-down-panel :container="container" v-model="dropDown">
						<overlay-text-style-edit v-if="model" v-model="model" />
					</drop-down-panel>
				</label-floater>
			</div>
			<data-input-base-menu
				v-model="model"
				:can-template="false"
				:can-clear="!schema.required"
				:disabled="disabled"
			/>
		</div>
		<div class="flex flex-row">
			<!-- <error-label :error-message="undefined" /> -->
		</div>
	</div>
</template>

<script setup lang="ts">
import { OverlayTextStyle, SchemaOverlayTextStyle } from "castmate-plugin-overlays-shared"
import {
	SharedDataInputProps,
	InputBox,
	LabelFloater,
	DropDownPanel,
	usePropagationStop,
	DataInputBaseMenu,
} from "castmate-ui-core"
import { CSSProperties, computed, ref, useModel } from "vue"
import OverlayTextStyleEdit from "./OverlayTextStyleEdit.vue"

const props = defineProps<
	{
		modelValue: OverlayTextStyle | undefined
		schema: SchemaOverlayTextStyle
	} & SharedDataInputProps
>()

const model = useModel(props, "modelValue")

const previewStyle = computed<CSSProperties>(() => {
	//Scale the preview so it ends up being 16px tall, the normal styled size
	return {
		...OverlayTextStyle.toCSSProperties(model.value, 16 / (model.value?.fontSize ?? 16)),
	}
})

//Expander
const container = ref<HTMLElement>()
const dropDown = ref(false)

const stopPropagation = usePropagationStop()

function openEdit(ev: MouseEvent) {
	if (ev.button != 0) return

	stopPropagation(ev)
	ev.preventDefault()

	if (!dropDown.value) {
		if (model.value == null) {
			model.value = OverlayTextStyle.factoryCreate()
		}

		dropDown.value = true
	} else {
		dropDown.value = false
	}
}
</script>

<style scoped>
.container {
	position: relative;
	cursor: pointer;
	user-select: none;

	display: flex;
	flex-direction: row;
}
</style>
