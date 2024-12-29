<template>
	<p-input-group
		class="w-full"
		:class="{ 'p-inputwrapper-filled': props.modelValue != null }"
		@mousedown="stopPropagation"
	>
		<filter-input-box
			ref="filterBox"
			v-bind="$attrs"
			v-model="model"
			@focus="onFocus"
			@blur="onBlur"
			@filter-key-down="onFilterKeyDown"
		>
			<slot name="selectedItem" v-if="props.modelValue != null" :item="selectedItem" :item-id="props.modelValue">
				<span style="white-space: nowrap">{{
					selectedItem ? getItemText(selectedItem, props) : props.modelValue
				}}</span>
			</slot>

			<template #append="{ filter, anchor }">
				<autocomplete-drop-list
					ref="dropDown"
					:container="anchor"
					v-model:focused-id="focusedId"
					v-model="dropDownOpen"
					:grouped-items="groupFilteredItems(filter, items, props)"
					:text-prop="textProp"
					:group-prop="groupProp"
					:current-id="selectedItem?.id"
					@select="onSelect"
					@closed="onBlur"
				>
					<template #groupHeader="scope" v-if="$slots.groupHeader">
						<slot name="groupHeader" v-bind="scope" />
					</template>

					<template #item="scope" v-if="$slots.item">
						<slot name="item" v-bind="scope" />
					</template>
				</autocomplete-drop-list>
				<slot name="append" :disabled="disabled"></slot>
				<p-button
					:disabled="disabled"
					class="no-focus-highlight flex-shrink-0"
					@click="onDropDownClick"
					@mousedown="onMousedown"
					><p-chevron-down-icon />
				</p-button>
			</template>
		</filter-input-box>
	</p-input-group>
</template>

<script setup lang="ts">
import { ref, useModel, nextTick, watch, computed } from "vue"
import PButton from "primevue/button"
import PInputGroup from "primevue/inputgroup"
import PChevronDownIcon from "@primevue/icons/chevrondown"
import { usePropagationStop } from "../../../util/dom"
import { getItemText, ItemType, AutocompleteItemProps, groupFilteredItems } from "../../../util/autocomplete-helpers"

import _clamp from "lodash/clamp"
import FilterInputBox from "./FilterInputBox.vue"
import AutocompleteDropList from "./AutocompleteDropList.vue"

const props = withDefaults(
	defineProps<
		{
			modelValue: any | undefined
			placeholder?: string
			items: ItemType[]
			inputId?: string
			disabled?: boolean
		} & AutocompleteItemProps
	>(),
	{}
)

const model = useModel(props, "modelValue")
const emit = defineEmits(["update:modelValue", "open"])

const dropDown = ref<InstanceType<typeof AutocompleteDropList>>()
const filterBox = ref<InstanceType<typeof FilterInputBox>>()

const stopPropagation = usePropagationStop()

////////////////////////////
//Drop Down Opening

const dropDownOpen = ref(false)
function show() {
	if (!dropDownOpen.value) {
		console.log("Opening")
		dropDownOpen.value = true
		focusedId.value = model.value
		emit("open")
	}
}
function hide() {
	console.log("Closing")
	dropDownOpen.value = false
}

function onDropDownClick(ev: MouseEvent) {
	if (ev.button != 0) return

	if (!dropDownOpen.value) {
		console.log("Open click")
		filterBox.value?.focus()
		show()
	} else {
		console.log("Close Click")
		hide()
		filterBox.value?.blur()
	}

	stopPropagation(ev)
}

function onMousedown(ev: MouseEvent) {
	if (ev.button != 0) return

	ev.preventDefault()
}
//////////////////
//Filtering

const selectedItem = computed(() => props.items.find((item) => item.id == model.value))

//////

const focusedId = ref<any | undefined>(undefined)

function onFocus(ev: FocusEvent) {
	show()
}
function onBlur(ev: FocusEvent) {
	hide()
}

function onSelect(item: any) {
	model.value = item.id
	hide()
	filterBox?.value?.blur()
}

////
//Key navigation

function onFilterKeyDown(ev: KeyboardEvent) {
	dropDown.value?.handleKeyEvent(ev)
}
</script>

<style scoped>
/** A smarter person would use cool CSS rules */
.fix-left {
	border-top-left-radius: 6px !important;
	border-bottom-left-radius: 6px !important;
}

.autocomplete-container {
	position: relative;
	/* display: flex; */
	/* flex-direction: row; */
	width: 100% !important;
}

.query-input {
	/*min-width: 150px;*/
	width: 0;
}
</style>
