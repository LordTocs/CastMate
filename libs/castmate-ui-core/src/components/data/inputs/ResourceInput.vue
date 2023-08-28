<template>
	<div class="container w-full" ref="container">
		<div class="p-inputgroup w-full" @mousedown="onMouseDown">
			<span class="p-float-label">
				<div
					class="p-dropdown p-inputwrapper"
					:class="{
						'p-filled': model != null,
						'p-focused': focused,
						'p-inputwrapper-filled': model != null,
						'p-inputwrapper-focused': focused || overlayVisible,
					}"
				>
					<div
						id="input-item"
						class="p-dropdown-label p-inputtext"
						:class="{ 'p-filled': model != null }"
						type="text"
						tabindex="-1"
						@focus="onFocus"
						v-if="!focused"
					>
						<span v-if="props.modelValue && !resourceItem">
							<!-- Missing Resource! -->
							{{ model }}
						</span>
						<span v-if="resourceItem">
							{{ resourceItem.config.name ?? model }}
						</span>
						<!-- TODO: Add custom item render here -->
					</div>
					<p-input-text
						v-else
						id="input-item"
						@blur="onBlur"
						class="p-dropdown-label"
						ref="filterInputElement"
						v-model="filterValue"
						@keydown="onFilterKeyDown"
					/>
				</div>
				<label for="input-item"> {{ props.schema.name }}</label>
			</span>
			<p-button @click="onDropDownClick"><p-chevron-down-icon /></p-button>
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
						<li
							class="p-dropdown-item"
							:class="{ 'p-focus': isItemFocused(item), 'p-highlight': isCurrentItem(item) }"
							v-for="(item, i) in filteredItems"
							:data-p-highlight="isCurrentItem(item)"
							:data-p-focused="isItemFocused(item)"
							:aria-label="getItemText(item)"
							:aria-selected="isCurrentItem(item)"
							@click="onItemSelect($event, item)"
						>
							{{ getItemText(item) }}
						</li>
					</ul>
				</div>
			</transition>
		</p-portal>
	</div>
</template>

<script setup lang="ts">
import { SchemaResource, ResourceData } from "castmate-schema"
import { ResourceProxy } from "../../../util/data"
import { computed, nextTick, ref, useModel, watch } from "vue"
import { useResource } from "../../../main"
import PInputText from "primevue/inputtext"
import PButton from "primevue/button"
import PChevronDownIcon from "primevue/icons/chevrondown"
import PPortal from "primevue/portal"
import { usePrimeVue } from "primevue/config"
import { DomHandler } from "primevue/utils"
import { useEventListener } from "@vueuse/core"
import _clamp from "lodash/clamp"

const props = defineProps<{
	schema: SchemaResource
	modelValue: ResourceProxy | undefined
}>()

const model = useModel(props, "modelValue")
const resourceStore = useResource(() => props.schema.resourceType)
const customViewComponent = computed(() => undefined)
const resourceItem = computed(() => {
	if (!model.value) return undefined
	return resourceStore.value?.resources?.get(model.value)
})
const itemText = computed(() => resourceItem.value?.config?.name ?? model.value)

function onMouseDown(ev: MouseEvent) {
	ev.stopPropagation()
}

const container = ref<HTMLElement | null>(null)

const primevue = usePrimeVue()

///Focus Handling
const filterValue = ref<string>("")
const filterInputElement = ref<{ $el: HTMLElement } | null>(null)
const focused = ref(false)
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

//Drop Down Opening
const overlayVisible = ref(false)
const overlayVisibleComplete = ref(false)

function show() {
	if (!overlayVisible.value) {
		overlayVisible.value = true
		focusedId.value = model.value ?? null
	}
}
function hide() {
	overlayVisible.value = false
	overlayVisibleComplete.value = false
}
function toggle() {
	if (overlayVisible.value) {
		hide()
	} else {
		show()
	}
}

const overlayDiv = ref<HTMLElement | null>(null)
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
		if (!container.value?.contains(ev.target as Node) && !overlayDiv.value?.contains(event?.target as Node)) {
			hide()
		}
	}
)

//Item Rendering
const filteredItems = computed<ResourceData[]>(() => {
	let items = [...(resourceStore.value?.resources.values() ?? [])]

	if (filterValue.value.length > 0) {
		const filterLower = filterValue.value.toLowerCase()
		items = items.filter((item) => getItemText(item).toLowerCase().includes(filterLower))
	}

	return items
})
watch(filteredItems, () => {
	if (overlayVisibleComplete.value) {
		nextTick(() => {
			if (!overlayDiv.value) return
			if (!container.value) return
			DomHandler.relativePosition(overlayDiv.value, container.value)
		})
	}
})

function isCurrentItem(item: ResourceData) {
	return model.value == item.id
}
function getItemText(item: ResourceData) {
	return item.config.name ?? item.id
}

function onItemSelect(ev: Event, item: ResourceData) {
	model.value = item.id
	hide()
	onBlur()
	ev.stopPropagation()
	ev.preventDefault()
}

//Key navigation
const focusedId = ref<string | null>(null)

function isItemFocused(item: ResourceData) {
	return item.id == focusedId.value
}

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
	if (focusedId.value && filteredItems.value.find((i) => i.id == focusedId.value)) {
		model.value = focusedId.value
		hide()
		onBlur()
	} else if (filteredItems.value.length > 0) {
		model.value = filteredItems.value[0].id
		hide()
		onBlur()
	}
	ev.stopPropagation()
	ev.preventDefault()
}

function onKeyArrowDown(ev: KeyboardEvent) {
	const index = filteredItems.value.findIndex((i) => i.id == focusedId.value)
	const nextId = filteredItems.value[_clamp(index + 1, 0, Math.max(filteredItems.value.length - 1, 0))].id
	focusedId.value = nextId
	ev.stopPropagation()
	ev.preventDefault()
}

function onKeyArrowUp(ev: KeyboardEvent) {
	const index = filteredItems.value.findIndex((i) => i.id == focusedId.value)
	const nextId = filteredItems.value[_clamp(index - 1, 0, Math.max(filteredItems.value.length - 1, 0))].id
	focusedId.value = nextId
	ev.stopPropagation()
	ev.preventDefault()
}
</script>

<style scoped>
.container {
	display: inline-flex;
	cursor: pointer;
	position: relative;
	user-select: none;
}

.overlay {
	position: absolute;
}
</style>
