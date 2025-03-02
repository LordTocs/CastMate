<template>
	<div class="flex flex-column widget-list">
		<div class="flex-grow-1 widget-list-container">
			<flex-scroller class="h-full" inner-class="flex flex-column gap-1">
				<data-binding-path local-path="widgets">
					<overlay-widget-list-item
						v-for="(widget, i) in model.widgets"
						v-model="model.widgets[i]"
						:selected="selection.includes(widget.id)"
						@click="widgetClick(i, $event)"
						@delete="deleteWidget(i)"
						:local-path="`[${i}]`"
					/>
				</data-binding-path>
			</flex-scroller>
		</div>
		<div class="flex flex-row px-2 pb-2">
			<p-button icon="mdi mdi-plus" @click="popAddMenu" class="extra-small-button" size="small" />
			<p-menu :model="addMenuItems" ref="addMenu" :popup="true" />
		</div>
	</div>
</template>

<script setup lang="ts">
import { OverlayConfig } from "castmate-plugin-overlays-shared"
import {
	useDocumentSelection,
	FlexScroller,
	usePropagationStop,
	useCommitUndo,
	DataBindingPath,
} from "castmate-ui-core"
import { computed, ref, useModel } from "vue"
import PButton from "primevue/button"
import PMenu from "primevue/menu"
import { OverlayWidgetInfo, useOverlayWidgets } from "castmate-overlay-widget-loader"
import type { MenuItem } from "primevue/menuitem"
import { nanoid } from "nanoid/non-secure"
import { constructDefault } from "castmate-schema"
import _cloneDeep from "lodash/cloneDeep"
import OverlayWidgetListItem from "./OverlayWidgetListItem.vue"

const props = defineProps<{
	modelValue: OverlayConfig
}>()

const model = useModel(props, "modelValue")

const selection = useDocumentSelection("widgets")

const overlayWidgets = useOverlayWidgets()

const commitUndo = useCommitUndo()

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
		visible: true,
		locked: false,
	})

	commitUndo()
}

const addMenu = ref<InstanceType<typeof PMenu>>()
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

const stopPropagation = usePropagationStop()

function widgetClick(idx: number, ev: MouseEvent) {
	if (ev.button != 0) return

	const id = props.modelValue.widgets[idx].id

	if (ev.ctrlKey) {
		const selIdx = selection.value.findIndex((s) => s == id)
		if (selIdx >= 0) {
			selection.value.splice(selIdx, 1)
		} else {
			selection.value.push(id)
		}
	} else {
		selection.value = [id]
		stopPropagation(ev)
	}
}

function deleteWidget(idx: number) {
	model.value.widgets.splice(idx, 1)
	commitUndo()
}
</script>

<style scoped>
.widget-list {
	min-height: 5rem;
}

.widget-list-container {
	padding: 0.5rem 0;
	margin: 0.5rem;
	border: solid 1px var(--surface-border);
	border-radius: var(--border-radius);
}

.widget-list-item {
	display: flex;
	flex-direction: row;
	align-items: center;
	padding: 0 0.5rem;
}

.widget-list-item.selected {
	background-color: rgba(96, 165, 250, 0.16);
}
</style>
