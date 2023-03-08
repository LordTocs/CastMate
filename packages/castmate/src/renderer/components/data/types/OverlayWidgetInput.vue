<template>
	<v-select
		v-model="modelObj"
		:label="label"
		:items="widgets"
		:clearable="!schema?.required"
		:density="density"
		return-object
		item-title="overlay"
		:item-value="(obj) => obj.overlay + '.' + overlay.widget"
	>
		<template #item="{ item, props: itemProps }">
			<v-list-item v-bind="itemProps" :title="getItemText(item.raw)" />
		</template>

		<template #selection="{ item }">
			{{ getItemText(item.raw) }}
		</template>
	</v-select>
</template>

<script setup>
import { computed } from "vue"
import { useModel } from "../../../utils/modelValue"
import { useResourceArray, useResourceType } from "../../../utils/resources"
import _flatten from "lodash/flatten"

const props = defineProps({
	modelValue: {},
	schema: {},
	label: {},
	density: { type: String },
})

const emit = defineEmits(["update:modelValue"])

const modelObj = useModel(props, emit)

const resoureType = useResourceType("overlay")
const overlays = useResourceArray("overlay")

const widgets = computed(() =>
	_flatten(
		overlays.value.map(
			(o) =>
				o.config.widgets
					?.filter((w) => w.type == props.schema?.widgetType)
					?.map((w) => ({ overlay: o.id, widget: w.id })) ?? []
		)
	)
)

function getItemText(item) {
    console.log("Getting Text", item)
	const overlay = overlays.value.find((o) => o.id == item.overlay)

	if (!overlay) return "MISSING OVERLAY"

	const widget = overlay.config.widgets.find((w) => w.id == item.widget)

	if (!widget) return `${overlay.config.name} | MISSING WIDGET`

	return `${overlay.config.name} | ${widget.name}`
}
</script>
