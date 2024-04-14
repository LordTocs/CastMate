<template>
	<div>
		<div class="flex flex-row">
			<div class="p-inputgroup" style="flex-grow: 1; flex-shrink: 1" @contextmenu="onContext">
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
			<p-button
				v-if="hasMenu"
				class="ml-1"
				text
				icon="mdi mdi-dots-vertical"
				aria-controls="input_menu"
				@click="menu?.toggle($event)"
				:disabled="disabled"
			></p-button>
			<p-menu ref="menu" id="input_menu" :model="menuItems" :popup="true" v-if="hasMenu" />
			<c-context-menu ref="contextMenu" :items="menuItems" v-if="hasMenu" />
		</div>
		<div class="flex flex-row">
			<!-- <error-label :error-message="undefined" /> -->
		</div>
	</div>
</template>

<script setup lang="ts">
import { OverlayTextStyle, SchemaOverlayTextStyle } from "castmate-plugin-overlays-shared"
import {
	DataInputBase,
	SharedDataInputProps,
	InputBox,
	LabelFloater,
	CContextMenu,
	DropDownPanel,
	usePropagationStop,
} from "castmate-ui-core"
import { MenuItem } from "primevue/menuitem"
import PMenu from "primevue/menu"
import PButton from "primevue/button"
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

//Menus
function clear() {
	model.value = undefined
}

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

const menu = ref<PMenu>()
const contextMenu = ref<InstanceType<typeof CContextMenu>>()

const menuItems = computed<MenuItem[]>(() => {
	let result: MenuItem[] = []

	if (!props.schema.required) {
		result.push({
			label: "Clear",
			command(event) {
				clear()
			},
		})
	}

	return result
})

const hasMenu = computed(() => {
	return menuItems.value.length > 0
})

function onContext(ev: MouseEvent) {
	if (hasMenu.value) {
		contextMenu.value?.show(ev)
		ev.stopPropagation()
		ev.preventDefault()
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
