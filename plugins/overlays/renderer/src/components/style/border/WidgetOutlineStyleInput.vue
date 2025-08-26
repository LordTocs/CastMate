<template>
	<data-input-base v-model="model" :schema="schema" ref="dataInputBase" :local-path="localPath">
		<template #prepend>
			<c-number-input v-model="width" local-path="width" style="width: 3rem" />
		</template>

		<template #default="inputProps">
			<div class="container w-full" ref="container">
				<input-box :model="model" @click="toggle" ref="inputBox" class="w-full">
					<div class="color-splash" :style="{ backgroundColor: color }"></div>
				</input-box>
			</div>
			<drop-down-panel class="p-1" v-model="overlayVisible" :container="container">
				<template v-if="isHexColor(color)">
					<c-color-picker v-model="color" :alpha="true" />
				</template>
			</drop-down-panel>
		</template>

		<template #extra>
			<c-dropdown
				v-model="style"
				:options="styleOptions"
				option-value="code"
				option-label="name"
				local-path="style"
				style="width: 4rem"
			>
				<template #value="slotProps">
					<div v-if="slotProps.value" class="flex items-center">
						<i :class="styleOptions.find((to) => to.code == slotProps.value)?.icon" />
					</div>
					<span v-else>
						{{ slotProps.placeholder }}
					</span>
				</template>
			</c-dropdown>
		</template>
	</data-input-base>
</template>

<script setup lang="ts">
import { SchemaWidgetOutlineStyle, WidgetOutlineStyle } from "castmate-plugin-overlays-shared"
import { isHexColor } from "castmate-schema"
import {
	SharedDataInputProps,
	DataInputBase,
	CNumberInput,
	useDefaultableModel,
	CDropdown,
	DropDownPanel,
	InputBox,
	useDataUIBinding,
	useDataBinding,
	CColorPicker,
} from "castmate-ui-core"
import { MenuItem } from "primevue/menuitem"
import { computed, ref, useTemplateRef } from "vue"

const props = defineProps<
	{
		schema: SchemaWidgetOutlineStyle
	} & SharedDataInputProps
>()

useDataBinding(() => props.localPath)

const model = defineModel<WidgetOutlineStyle>()
const width = useDefaultableModel(model, "width", 3, WidgetOutlineStyle.factoryCreate)
const color = useDefaultableModel(model, "color", "#000000", WidgetOutlineStyle.factoryCreate)
const style = useDefaultableModel(model, "style", "solid", WidgetOutlineStyle.factoryCreate)

const styleOptions = computed<MenuItem[]>(() => [
	{
		icon: "ovi ovi-solid-border",
		code: "solid",
		name: "Solid",
	},
	{
		icon: "ovi ovi-dashed-border",
		code: "dashed",
		name: "Dashed",
	},
	{
		icon: "ovi ovi-dotted-border",
		code: "dotted",
		name: "Dotted",
	},
])

const overlayVisible = ref(false)

function show() {
	if (!overlayVisible.value) {
		overlayVisible.value = true
	}
}
function hide() {
	overlayVisible.value = false
}
function toggle(ev: MouseEvent) {
	if (ev.button != 0) return

	ev.stopImmediatePropagation()

	if (overlayVisible.value) {
		hide()
	} else {
		show()
	}
}

const container = useTemplateRef("container")
// const inputBox = useTemplateRef("inputBox")
const dib = useTemplateRef("dataInputBase")

// useDataUIBinding({
// 	focus() {
// 		inputBox.value?.inputDiv?.focus()
// 	},
// 	scrollIntoView() {
// 		inputBox.value?.inputDiv?.scrollIntoView()
// 	},
// })
</script>

<style scoped>
.overlay {
	position: absolute;
	max-height: 25rem;
	overflow-y: auto;
}

.color-splash {
	display: inline-block;
	height: 1em;
	width: 100%;
	border-radius: var(--border-radius);
	vertical-align: bottom;
}
</style>
