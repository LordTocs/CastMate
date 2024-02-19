<template>
	<div
		class="autocomplete-container p-inputgroup"
		:class="{ 'p-inputwrapper-filled': props.modelValue != null }"
		ref="container"
		v-bind="$attrs"
		@mousedown="stopPropagation"
	>
		<input-box
			:focused="focused"
			:model="model"
			@focus="onFocus"
			v-if="!focused"
			:tab-index="-1"
			:bezel-right="false"
			:placeholder="placeholder"
			class="clickable-input"
		>
			<slot name="selectedItem" v-if="props.modelValue != null" :item="selectedItem" :item-id="props.modelValue">
				<span style="white-space: nowrap">{{
					selectedItem ? getItemText(selectedItem, props) : props.modelValue
				}}</span>
			</slot>
		</input-box>
		<p-input-text
			v-else
			@blur="onBlur"
			class="p-dropdown-label query-input"
			ref="filterInputElement"
			v-model="filterValue"
			@keydown="onFilterKeyDown"
			:placeholder="placeholder"
		/>
		<slot name="append"></slot>
		<p-button class="no-focus-highlight flex-shrink-0" @click="onDropDownClick"><p-chevron-down-icon /></p-button>
	</div>
	<autocomplete-drop-list
		ref="dropDown"
		:container="container"
		v-model:focused-id="focusedId"
		v-model="overlayVisible"
		:grouped-items="filteredItems"
		:text-prop="textProp"
		:group-prop="groupProp"
		:current-id="selectedItem?.id"
		@select="(item) => (model = item.id)"
		@closed="onBlur"
	>
		<template #groupHeader="scope" v-if="$slots.groupHeader">
			<slot name="groupHeader" v-bind="scope" />
		</template>

		<template #item="scope" v-if="$slots.item">
			<slot name="item" v-bind="scope" />
		</template>
	</autocomplete-drop-list>
</template>

<script setup lang="ts">
import { ref, useModel, nextTick, watch, computed } from "vue"
import PInputText from "primevue/inputtext"
import PButton from "primevue/button"
import PChevronDownIcon from "primevue/icons/chevrondown"
import { useElementSize, useEventListener } from "@vueuse/core"
import { stopPropagation } from "../../../util/dom"
import {
	useGroupedFilteredItems,
	getItemText,
	ItemType,
	AutocompleteItemProps,
	getPrevItem,
	getNextItem,
	findItem,
} from "../../../util/autocomplete-helpers"
import LabelFloater from "./LabelFloater.vue"
import _clamp from "lodash/clamp"
import { DropDownPanel, InputBox } from "../../../main"
import AutocompleteDropList from "./AutocompleteDropList.vue"

const props = withDefaults(
	defineProps<
		{
			modelValue: any | undefined
			placeholder?: string
			items: ItemType[]
			inputId?: string
		} & AutocompleteItemProps
	>(),
	{}
)

const model = useModel(props, "modelValue")
const emit = defineEmits(["update:modelValue", "open"])

const dropDown = ref<InstanceType<typeof AutocompleteDropList>>()

function clear() {
	model.value = undefined
}

////////////////////////////
//Drop Down Opening
const container = ref<HTMLElement | null>(null)

const overlayVisible = ref(false)
function show() {
	if (!overlayVisible.value) {
		overlayVisible.value = true
		focusedId.value = model.value
		emit("open")
	}
}
function hide() {
	overlayVisible.value = false
}

function onDropDownClick(ev: MouseEvent) {
	if (!overlayVisible.value) {
		focused.value = true
		show()
		nextTick(() => {
			filterInputElement.value?.$el?.focus()
		})
	} else {
		hide()
	}
}
//////////////////
//Filtering

const filterValue = ref<string>("")
const filterInputElement = ref<{ $el: HTMLElement } | null>(null)
const filteredItems = useGroupedFilteredItems(filterValue, () => props.items, props)

const selectedItem = computed(() => props.items.find((item) => item.id == model.value))

//////

const focused = ref(false)
const focusedId = ref<any | undefined>(undefined)

function onFocus(ev: FocusEvent) {
	focused.value = true
	//filterValue.value = itemText.value ?? ""
	show()
	nextTick(() => {
		filterInputElement.value?.$el?.focus()
	})
}
function onBlur() {
	focused.value = false
	filterValue.value = ""
	hide()
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
	min-width: 150px;
}
</style>
