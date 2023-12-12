<template>
	<div
		class="autocomplete-container flex-grow-1 flex-shrink-0 p-inputgroup"
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
		>
			<slot name="selectedItem" v-if="props.modelValue" :item="selectedItem" :item-id="props.modelValue">
				{{ selectedItem ? getItemText(selectedItem, props) : props.modelValue }}
			</slot>
		</input-box>
		<p-input-text
			v-else
			@blur="onBlur"
			class="p-dropdown-label"
			ref="filterInputElement"
			v-model="filterValue"
			@keydown="onFilterKeyDown"
			:placeholder="placeholder"
		/>
		<slot name="append"></slot>
		<p-button
			class="flex-none no-focus-highlight flex-shrink-0"
			v-if="!required"
			icon="pi pi-times"
			@click.stop="clear"
		/>
		<p-button class="no-focus-highlight flex-shrink-0" @click="onDropDownClick"><p-chevron-down-icon /></p-button>
	</div>
	<drop-down-panel
		:container="container"
		v-model="overlayVisible"
		:style="{
			width: `${containerSize.width.value}px`,
			overflowY: 'auto',
			maxHeight: '15rem',
		}"
		class="autocomplete-drop-down"
	>
		<ul class="p-dropdown-items">
			<template v-for="(group, i) in filteredItems">
				<slot name="groupHeader" :item="group[0]"> </slot>

				<slot
					name="item"
					v-for="(item, i) in group"
					:item="item"
					:index="i"
					:focused="isItemFocused(item)"
					:highlighted="isCurrentItem(item)"
					:onClick="(ev: MouseEvent) => onItemSelect(ev, item)"
				>
					<li
						class="p-dropdown-item"
						:class="{ 'p-focus': isItemFocused(item), 'p-highlight': isCurrentItem(item) }"
						:data-p-highlight="isCurrentItem(item)"
						:data-p-focused="isItemFocused(item)"
						:aria-label="getItemText(item, props)"
						:aria-selected="isCurrentItem(item)"
						@click="onItemSelect($event, item)"
					>
						{{ getItemText(item, props) }}
					</li>
				</slot>
			</template>
		</ul>
	</drop-down-panel>
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

const props = withDefaults(
	defineProps<
		{
			modelValue: any | undefined
			placeholder?: string
			items: ItemType[]
			required: boolean
			inputId: string
		} & AutocompleteItemProps
	>(),
	{
		required: true,
	}
)

const model = useModel(props, "modelValue")
const emit = defineEmits(["update:modelValue", "open"])

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
const containerSize = useElementSize(container)
//////////////////
//Filtering

const filterValue = ref<string>("")
const filterInputElement = ref<{ $el: HTMLElement } | null>(null)
const filteredItems = useGroupedFilteredItems(filterValue, () => props.items, props)

function onItemSelect(ev: Event, item: ItemType) {
	model.value = item.id
	onBlur()
	ev.stopPropagation()
	ev.preventDefault()
}

function isCurrentItem(item: ItemType) {
	return model.value == item.id
}
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

function isItemFocused(item: ItemType) {
	return item.id == focusedId.value
}

////
//Key navigation

function onFilterKeyDown(ev: KeyboardEvent) {
	if (ev.key == "ArrowDown") {
		onKeyArrowDown(ev)
	} else if (ev.key == "ArrowUp") {
		onKeyArrowUp(ev)
	} else if (ev.key == "Enter") {
		selectedFocusedItem(ev)
	} else if (ev.key == "Escape") {
		onBlur()
		ev.stopPropagation()
		ev.preventDefault()
	}
}

function selectedFocusedItem(ev: Event) {
	if (findItem(filteredItems.value, focusedId.value)) {
		model.value = focusedId.value
		onBlur()
	} else if (filteredItems.value.length > 0) {
		model.value = filteredItems.value[0][0]?.id
		onBlur()
	}
	ev.stopPropagation()
	ev.preventDefault()
}

function onKeyArrowDown(ev: KeyboardEvent) {
	focusedId.value = getNextItem(filteredItems.value, focusedId.value)
	ev.stopPropagation()
	ev.preventDefault()
}

function onKeyArrowUp(ev: KeyboardEvent) {
	focusedId.value = getPrevItem(filteredItems.value, focusedId.value)
	ev.stopPropagation()
	ev.preventDefault()
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
	display: flex;
	flex-direction: row;
}
</style>
