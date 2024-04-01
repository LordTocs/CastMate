<template>
	<data-input-base
		:schema="schema"
		v-model="model"
		:toggle-template="false"
		:disabled="disabled"
		:no-float="noFloat"
		v-slot="inputProps"
	>
		<c-autocomplete
			v-model="modelId"
			:required="!!schema.required"
			:items="items"
			v-bind="inputProps"
			text-prop="name"
		>
			<!-- <template #selectedItem="{ item }">
				<span style="white-space: nowrap"> {{ getOverlayName(item) }} | {{ getWidgetName(item) }} </span>
			</template>

			<template #item="{ item, focused, highlighted, onClick }">
				<li
					class="p-dropdown-item"
					:class="{ 'p-focus': focused, 'p-highlight': highlighted }"
					:data-p-highlight="highlighted"
					:data-p-focused="focused"
					:aria-label="item.name"
					:aria-selected="highlighted"
					@click="onClick"
				>
					<span style="white-space: nowrap"> {{ getOverlayName(item) }} | {{ getWidgetName(item) }} </span>
				</li>
			</template> -->
		</c-autocomplete>
	</data-input-base>
</template>

<script setup lang="ts">
import { OverlayConfig, OverlayWidget, OverlayWidgetConfig, SchemaOverlayWidget } from "castmate-plugin-overlays-shared"
import { ResourceData } from "castmate-schema"
import { DataInputBase, SharedDataInputProps, CAutocomplete, useResourceArray } from "castmate-ui-core"
import { computed, useModel } from "vue"

const props = defineProps<
	{
		modelValue: OverlayWidget | undefined
		schema: SchemaOverlayWidget
	} & SharedDataInputProps
>()

interface WidgetWithID extends OverlayWidget {
	id: string
	name: string
}

const model = useModel(props, "modelValue")

const modelId = computed({
	get() {
		if (!props.modelValue) return undefined
		return `${props.modelValue.overlayId}.${props.modelValue.widgetId}`
	},
	set(v) {
		if (v == null) {
			model.value = undefined
			return
		}

		const [overlayId, widgetId] = v.split(".")

		console.log("Setting", overlayId, widgetId)

		model.value = {
			overlayId,
			widgetId,
		}
	},
})

const overlays = useResourceArray<ResourceData<OverlayConfig>>("Overlay")

function getOverlayName(data: WidgetWithID) {
	console.log("Fetching OName", data)
	if (!data) return "MISSING"
	const overlay = overlays.value.find((o) => o.id == data.overlayId)

	if (!overlay) return "MISSING"

	return overlay.config.name
}

function getWidgetName(data: WidgetWithID) {
	if (!data) return "MISSING"
	const overlay = overlays.value.find((o) => o.id == data.overlayId)

	if (!overlay) return "MISSING"

	const widget = overlay.config.widgets.find((w) => w.id == data.widgetId)
	if (!widget) return "MISSING"

	return widget.name
}

function widgetMatches(widget: OverlayWidgetConfig) {
	if (props.schema.widgetType == null) return true

	if (!Array.isArray(props.schema.widgetType)) {
		return widget.plugin == props.schema.widgetType.plugin && widget.widget == props.schema.widgetType.widget
	}

	for (const type of props.schema.widgetType) {
		if (widget.plugin == type.plugin && widget.widget == type.widget) {
			return true
		}
	}

	return false
}

const items = computed(() => {
	const items = new Array<WidgetWithID>()

	for (const overlay of overlays.value) {
		for (const widget of overlay.config.widgets) {
			if (widgetMatches(widget)) {
				items.push({
					id: `${overlay.id}.${widget.id}`,
					overlayId: overlay.id,
					widgetId: widget.id,
					name: `${overlay.config.name} | ${widget.name}`,
				})
			}
		}
	}

	return items
})
</script>
