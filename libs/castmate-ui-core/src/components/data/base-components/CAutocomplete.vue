<template>
	<div class="container w-full" ref="container">
		<div class="p-inputgroup w-full" @mousedown="stopPropagation">
			<label-floater :no-float="noFloat" :label="label" v-slot="labelProps" :input-id="inputId">
				<div
					class="p-component p-dropdown p-inputwrapper fix-left"
					:class="{
						'p-filled': model != null,
						'p-focused': focused,
						'p-inputwrapper-filled': model != null,
						'p-inputwrapper-focused': focused || overlayVisible,
					}"
				>
					<div
						class="p-dropdown-label p-inputtext"
						:class="{ 'p-filled': model != null, 'p-placeholder': !props.modelValue }"
						type="text"
						tabindex="-1"
						@focus="onFocus"
						v-if="!focused"
						:input-id="labelProps.inputId"
					>
						<slot
							name="selectedItem"
							v-if="props.modelValue"
							:item="selectedItem"
							:item-id="props.modelValue"
						>
							{{ selectedItem ? getItemText(selectedItem, props) : props.modelValue }}
						</slot>
						<template v-else-if="label"> {{ label }} </template>
						<template v-else>&nbsp;</template>
						<!-- Todo: Placeholder -->
					</div>
					<p-input-text
						v-else
						@blur="onBlur"
						class="p-dropdown-label"
						ref="filterInputElement"
						v-model="filterValue"
						@keydown="onFilterKeyDown"
						v-bind="labelProps"
					/>
				</div>
			</label-floater>
			<p-button class="flex-none no-focus-highlight" v-if="!required" icon="pi pi-times" @click.stop="clear" />
			<p-button class="no-focus-highlight" @click="onDropDownClick"><p-chevron-down-icon /></p-button>
		</div>
		<p-portal append-to="self">
			<transition name="p-connected-overlay" @enter="onOverlayEnter">
				<div
					v-if="overlayVisible"
					ref="overlayDiv"
					class="overlay p-dropdown-panel p-component p-ripple-disabled"
					:style="{
						zIndex: primevue.config.zIndex?.overlay,
					}"
				>
					<ul class="p-dropdown-items">
						<template v-for="(group, i) in filteredItems">
							<slot name="groupHeader" :item="group[0]"> </slot>

							<slot name="item" v-for="(item, i) in group" :item="item" :index="i">
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
				</div>
			</transition>
		</p-portal>
	</div>
</template>

<script setup lang="ts">
import { ref, useModel, nextTick, watch, computed } from "vue"
import PInputText from "primevue/inputtext"
import PButton from "primevue/button"
import PChevronDownIcon from "primevue/icons/chevrondown"
import PPortal from "primevue/portal"
import { usePrimeVue } from "primevue/config"
import { DomHandler } from "primevue/utils"
import { useEventListener } from "@vueuse/core"
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

const props = withDefaults(
	defineProps<
		{
			modelValue: string | undefined
			label?: string
			noFloat?: boolean
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

function clear() {
	model.value = undefined
}

////////////////////////////
//Drop Down Opening
const primevue = usePrimeVue()
const container = ref<HTMLElement | null>(null)
const overlayDiv = ref<HTMLElement | null>(null)

const overlayVisible = ref(false)
const overlayVisibleComplete = ref(false)

function show() {
	if (!overlayVisible.value) {
		overlayVisible.value = true
		focusedId.value = model.value
	}
}
function hide() {
	overlayVisible.value = false
	overlayVisibleComplete.value = false
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

function onOverlayEnter() {
	if (!overlayDiv.value) return
	if (!container.value) return

	overlayVisibleComplete.value = true

	DomHandler.relativePosition(overlayDiv.value, container.value)
}

useEventListener(
	() => (overlayVisibleComplete.value ? document : undefined),
	"click",
	(ev) => {
		if (!container.value?.contains(ev.target as Node) && !overlayDiv.value?.contains(ev?.target as Node)) {
			hide()
		}
	}
)

//////////////////
//Filtering

const filterValue = ref<string>("")
const filterInputElement = ref<{ $el: HTMLElement } | null>(null)
const filteredItems = useGroupedFilteredItems(filterValue, () => props.items, props)
watch(filteredItems, () => {
	if (overlayVisibleComplete.value) {
		nextTick(() => {
			if (!overlayDiv.value) return
			if (!container.value) return
			DomHandler.relativePosition(overlayDiv.value, container.value)
		})
	}
})

function onItemSelect(ev: Event, item: ItemType) {
	model.value = item.id
	hide()
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
const focusedId = ref<string | undefined>(undefined)

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
		hide()
		onBlur()
		ev.stopPropagation()
		ev.preventDefault()
	}
}

function selectedFocusedItem(ev: Event) {
	if (findItem(filteredItems.value, focusedId.value)) {
		model.value = focusedId.value
		hide()
		onBlur()
	} else if (filteredItems.value.length > 0) {
		model.value = filteredItems.value[0][0]?.id
		hide()
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
</style>
