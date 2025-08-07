<template>
	<div class="border-radius-edit">
		<div class="corner tl" ref="tl" :class="{ 'edit-drag': tlDragging }">
			<widget-size-editable v-model="tlLinked" local-path="topLeft" />
		</div>
		<div class="corner tr" ref="tr" :class="{ 'edit-drag': trDragging }">
			<widget-size-editable v-model="trLinked" local-path="topRight" />
		</div>
		<div class="corner bl" ref="bl" :class="{ 'edit-drag': blDragging }">
			<widget-size-editable v-model="blLinked" local-path="bottomLeft" />
		</div>
		<div class="corner br" ref="br" :class="{ 'edit-drag': brDragging }">
			<widget-size-editable v-model="brLinked" local-path="bottomRight" />
		</div>
		<p-button @click="linked = !linked">
			<i v-if="linked" class="pi pi-lock" />
			<i v-else class="pi pi-lock-open" />
		</p-button>
	</div>
</template>

<script setup lang="ts">
import { SchemaWidgetBorderRadius, WidgetBorderRadius } from "castmate-plugin-overlays-shared"
import { SharedDataInputProps, useDataBinding, useDefaultableModel, useDragValue, usePropModel } from "castmate-ui-core"
import { computed, onMounted, Ref, ref, watch } from "vue"
import WidgetSizeEditable from "./WidgetSizeEditable.vue"
import PButton from "primevue/button"

const props = defineProps<
	{
		schema: SchemaWidgetBorderRadius
	} & SharedDataInputProps
>()

const model = defineModel<WidgetBorderRadius>()

useDataBinding(() => props.localPath)

const tl = ref<HTMLElement>()
const tr = ref<HTMLElement>()
const br = ref<HTMLElement>()
const bl = ref<HTMLElement>()

const linked = ref(false)

onMounted(() => {
	linked.value = tlValue.value == trValue.value && blValue.value == brValue.value && tlValue.value == blValue.value
})

const tlValue = useDefaultableModel(model, "topLeft", undefined, WidgetBorderRadius.factoryCreate)
const trValue = useDefaultableModel(model, "topRight", undefined, WidgetBorderRadius.factoryCreate)
const blValue = useDefaultableModel(model, "bottomLeft", undefined, WidgetBorderRadius.factoryCreate)
const brValue = useDefaultableModel(model, "bottomRight", undefined, WidgetBorderRadius.factoryCreate)

function useLinkedValue(value: Ref<number | undefined>, others: Array<Ref<number | undefined>>) {
	return computed({
		get() {
			return value.value
		},
		set(v) {
			value.value = v
			if (linked.value) {
				for (const o of others) {
					o.value = v
				}
			}
		},
	})
}

const tlLinked = useLinkedValue(tlValue, [trValue, blValue, brValue])
const trLinked = useLinkedValue(trValue, [tlValue, blValue, brValue])
const blLinked = useLinkedValue(blValue, [trValue, tlValue, brValue])
const brLinked = useLinkedValue(brValue, [trValue, blValue, tlValue])

const dragScale = 3

const tlDragging = useDragValue(tl, tlLinked, {
	direction: "up-left",
	scale: dragScale,
	min: 0,
})

const trDragging = useDragValue(tr, trLinked, {
	direction: "up-right",
	scale: dragScale,
	min: 0,
})

const blDragging = useDragValue(bl, blLinked, {
	direction: "down-left",
	scale: dragScale,
	min: 0,
})

const brDragging = useDragValue(br, brLinked, {
	direction: "down-right",
	scale: dragScale,
	min: 0,
})
</script>

<style scoped>
.border-radius-edit {
	position: relative;
	height: 6rem;

	display: flex;
	justify-content: center;
	align-items: center;
}

.corner {
	position: absolute;
	background-color: var(--surface-b);
	border: solid 1px var(--surface-d);

	display: flex;
	justify-content: center;
	align-items: center;
}

.corner .edit-drag {
	background-color: var(--surface-200) !important;
}

.corner:hover {
	background-color: var(--surface-100);
}

.tl {
	border-top-left-radius: var(--border-radius);
	left: 0;
	top: 0;
	width: 50%;
	height: 50%;

	cursor: nwse-resize;
}

.tr {
	border-top-right-radius: var(--border-radius);
	left: 50%;
	top: 0;
	width: 50%;
	height: 50%;

	cursor: nesw-resize;
}

.bl {
	border-bottom-left-radius: var(--border-radius);
	left: 0;
	top: 50%;
	width: 50%;
	height: 50%;

	cursor: nesw-resize;
}

.br {
	border-bottom-right-radius: var(--border-radius);
	left: 50%;
	top: 50%;
	width: 50%;
	height: 50%;

	cursor: nwse-resize;
}
</style>
