<template>
	<div class="flex flex-column widget-list">
		<flex-scroller class="flex-grow-1">
			<div
				class="widget-list-item flex flex-row"
				:class="{ selected: selection.includes(widget.id) }"
				v-for="(widget, i) in model.widgets"
				:key="widget.id"
			>
				<div class="flex-grow-1">{{ widget.name }}</div>
				<p-toggle-button on-icon="mdi mdi-eye-outline" off-icon="mdi mdi-eye-off-outline" size="small" />
			</div>
		</flex-scroller>
		<div class="flex flex-row">
			<p-button icon="mdi mdi-plus" @click="popAddMenu" />
			<p-menu :model="addMenuItems" ref="addMenu" :popup="true" />
		</div>
	</div>
</template>

<script setup lang="ts">
import { OverlayConfig } from "castmate-plugin-overlays-shared"
import { useDocumentPath, useDocumentSelection, FlexScroller } from "castmate-ui-core"
import { computed, ref, useModel } from "vue"
import PButton from "primevue/button"
import PMenu from "primevue/menu"
import PToggleButton from "primevue/togglebutton"
import { OverlayWidgetInfo, useOverlayWidgets } from "castmate-overlay-widget-loader"
import { MenuItem } from "primevue/menuitem"
import { nanoid } from "nanoid/non-secure"
import { constructDefault } from "castmate-schema"
import _cloneDeep from "lodash/cloneDeep"

const props = defineProps<{
	modelValue: OverlayConfig
}>()

const model = useModel(props, "modelValue")

const documentPath = useDocumentPath()

const selection = useDocumentSelection(documentPath)

const overlayWidgets = useOverlayWidgets()

async function addWidget(widget: OverlayWidgetInfo) {
	const size = {
		width:
			widget.component.widget.defaultSize.width == "canvas"
				? props.modelValue.size.width
				: widget.component.widget.defaultSize.width,
		height:
			widget.component.widget.defaultSize.height == "canvas"
				? props.modelValue.size.height
				: widget.component.widget.defaultSize.height,
	}

	let name = widget.component.widget.name
	let number = 1

	while (model.value.widgets.find((w) => w.name == name)) {
		name = `${widget.component.widget.name} ${number}`
		number++
	}

	model.value.widgets.push({
		id: nanoid(),
		plugin: widget.plugin,
		widget: widget.component.widget.id,
		config: await constructDefault(widget.component.widget.config),
		size,
		position: {
			x: 0,
			y: 0,
		},
		name,
	})
}

const addMenu = ref<PMenu>()
const addMenuItems = computed<MenuItem[]>(() => {
	return overlayWidgets.widgets.map((w) => {
		return {
			label: w.component.widget.name,
			icon: w.component.widget.icon,
			command() {
				addWidget(w)
			},
		}
	})
})

function popAddMenu(ev: MouseEvent) {
	console.log(overlayWidgets.widgets)

	addMenu.value?.toggle(ev)
}
</script>

<style scoped>
.widget-list {
	min-height: 5rem;
	height: 100%;
}

.widget-list-item {
}

.widget-list-item.selected {
}
</style>
