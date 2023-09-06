<template>
	<p-portal :append-to="appendTo">
		<div
			class="p-menu p-component filter-palette p-ripple-disabled"
			:style="{ '--page-x': `${pageX}px`, '--page-y': `${pageY}px` }"
			v-if="visible"
			@mousedown="onMouseDown"
		>
			<div class="p-menu-start">
				<span class="w-full p-inputgroup">
					<p-input-text
						v-model="filter"
						ref="filterInput"
						:placeholder="filterPlaceholder"
						@keydown="onKeyDown"
					/>
				</span>
			</div>
			<ul class="p-menu-list" ref="scroller">
				<template v-for="item of filteredItems">
					<template v-if="item.items">
						<!-- This is a group header -->
						<li :class="['p-submenu-header', item.class]" :style="item.style">
							<slot name="submenuheader" :item="item">
								<i v-if="item.icon" :class="['p-menuitem-icon', item.icon]"></i>
								<span class="p-menuitem-text">
									{{ getItemText(item) }}
								</span>
							</slot>
						</li>
						<li
							v-for="(subitem, i) in item.items"
							:key="subitem.key"
							class="p-menuitem"
							:class="{ 'p-focus': isItemFocused(subitem), 'p-highlight': isCurrentItem(item) }"
							:style="subitem.style"
							:data-p-highlight="isCurrentItem(subitem)"
							:data-p-focused="isItemFocused(subitem)"
							:aria-label="getItemText(subitem)"
							:aria-selected="isCurrentItem(subitem)"
						>
							<div
								class="p-menuitem-content"
								:style="subitem.style"
								@click="onItemSelect($event, subitem)"
							>
								<slot name="item" :item="subitem">
									<a class="p-menuitem-link">
										<i v-if="subitem.icon" :class="['p-menuitem-icon', subitem.icon]"></i>
										<span class="p-menuitem-text">
											{{ getItemText(subitem) }}
										</span>
									</a>
								</slot>
							</div>
						</li>
					</template>
					<!-- TODO: Apply item.class -->
					<li
						v-else
						v-for="(item, i) in filteredItems"
						class="p-menuitem"
						:class="{ 'p-focus': isItemFocused(item), 'p-highlight': isCurrentItem(item) }"
						:style="item.style"
						:key="item.key"
						:data-p-highlight="isCurrentItem(item)"
						:data-p-focused="isItemFocused(item)"
						:aria-label="getItemText(item)"
						:aria-selected="isCurrentItem(item)"
					>
						<div class="p-menuitem-content" :style="item.style" @click="onItemSelect($event, item)">
							<slot name="item" :item="item">
								<a class="p-menuitem-link">
									<i v-if="item.icon" :class="['p-menuitem-icon', item.icon]"></i>
									<span class="p-menuitem-text">
										{{ getItemText(item) }}
									</span>
								</a>
							</slot>
						</div>
					</li>
				</template>
			</ul>
		</div>
	</p-portal>
</template>

<script setup lang="ts">
import PPortal from "primevue/portal"
import PInputText from "primevue/inputtext"
import { ref, toValue, computed, markRaw, nextTick, watch } from "vue"
import { MenuItem } from "primevue/menuitem"
import { ObjectUtils } from "primevue/utils"
import _cloneDeep from "lodash/cloneDeep"
import { useEventListener } from "@vueuse/core"

const props = withDefaults(
	defineProps<{
		items: MenuItem[]
		optionValue?: string | (() => string)
		dataKey?: string
		filterPlaceholder?: string
		appendTo?: string
	}>(),
	{
		optionValue: "value",
		filterPlaceholder: "Filter",
		appendTo: "body",
	}
)
const filter = ref("")
const filterInput = ref<{ $el: HTMLElement } | null>(null)
function filterItem(item: MenuItem, filterValue: string): MenuItem | undefined {
	if (item.items) {
		const resultItem: MenuItem = {
			...item,
		}
		resultItem.items = []
		let hasItem = false
		for (const subItem of item.items) {
			const filteredItem = filterItem(subItem, filterValue)
			if (filteredItem) {
				resultItem.items.push(filteredItem)
				hasItem = true
			}
		}
		return hasItem ? resultItem : undefined
	} else {
		return getItemText(item).toLocaleLowerCase().includes(filterValue) ? item : undefined
	}
}

const filteredItems = computed<MenuItem[]>(() => {
	const filterValue = toValue(filter).toLocaleLowerCase().trim()

	if (filterValue.length == 0) {
		return props.items
	}

	const result: MenuItem[] = []

	for (const item of props.items) {
		const filtered = filterItem(item, filterValue)
		if (filtered) {
			result.push(filtered)
		}
	}

	return result
})

const visible = ref(false)
function hide() {
	visible.value = false
}
function show() {
	filter.value = ""
	visible.value = true
	focusedId.value = null
	nextTick(() => filterInput.value?.$el?.focus())
}
useEventListener(
	computed(() => (visible.value ? markRaw(window) : undefined)),
	"click",
	(ev: MouseEvent) => {
		hide()
	}
)

const pageX = ref<number>(0)
const pageY = ref<number>(0)

defineExpose({
	open(event: MouseEvent) {
		pageX.value = event.pageX
		pageY.value = event.pageY
		show()
	},
})

const focusedId = ref<string | null>(null)
function isItemFocused(item: MenuItem) {
	return item.key == focusedId.value
}

function getItemValue(item: MenuItem) {
	//@ts-ignore prime-vue has mistyped their function
	return props.optionValue ? ObjectUtils.resolveFieldData(item, props.optionValue) : item
}

function isCurrentItem(item: MenuItem) {
	//@ts-ignore prime-vue has mistyped their function
	return false
}

function getItemText(item: MenuItem) {
	return toValue(item.label) ?? ""
}

function onItemSelect(ev: MouseEvent, item: MenuItem) {
	item.command?.({
		originalEvent: ev,
		item,
	})
	ev.stopPropagation()
	ev.preventDefault()
}

watch(filteredItems, () => {
	if (focusedId.value) {
		const item = getItemById(filteredItems.value, focusedId.value)
		if (!item) {
			focusedId.value = null
		}
	}
})

////

function hasId(item: MenuItem, id: string) {
	if (item.items) {
		for (const subitem of item.items) {
			const subresult = hasId(subitem, id)
			if (subresult) {
				return true
			}
		}
		return false
	} else {
		return item.key === id
	}
}

function getItemById(items: MenuItem[], id: string): MenuItem | undefined {
	for (const item of items) {
		if (item.items) {
			const result = getItemById(item.items, id)
			if (result != null) {
				return result
			}
		} else {
			if (item.key == id) {
				return item
			}
		}
	}
	return undefined
}

function getFirstId(item: MenuItem | undefined) {
	if (!item) return undefined

	if (item.items && item.items.length > 0) {
		return getFirstId(item.items[0])
	} else if (!item.items) {
		return item.key
	}
	return undefined
}

function getLastId(item: MenuItem | undefined) {
	if (!item) return undefined

	if (item.items && item.items.length > 0) {
		return getLastId(item.items[item.items.length - 1])
	} else if (!item.items) {
		return item.key
	}
	return undefined
}

function getNextId(items: MenuItem[], id: string): string | undefined {
	for (let i = 0; i < items.length; ++i) {
		const item = items[i]

		if (!item.items && item.key == id) {
			//Grab the first out of i + 1
			return getFirstId(items[i + 1])
		} else if (item.items && hasId(item, id)) {
			//This is a group
			let nextId = getNextId(item.items, id)
			if (!nextId) {
				nextId = getFirstId(items[i + 1])
			}
			return nextId
		}
	}
	return undefined
}

function getPrevId(items: MenuItem[], id: string): string | undefined {
	for (let i = 0; i < items.length; ++i) {
		const item = items[i]

		if (!item.items && item.key == id) {
			//Grab the first out of i + 1
			return getLastId(items[i - 1])
		} else if (item.items && hasId(item, id)) {
			//This is a group
			let prevId = getPrevId(item.items, id)
			if (!prevId) {
				prevId = getLastId(items[i - 1])
			}
			return prevId
		}
	}
	return undefined
}

function onKeyArrowDown(ev: KeyboardEvent) {
	if (focusedId.value) {
		const nextId = getNextId(props.items, focusedId.value)
		focusedId.value = nextId ?? focusedId.value
	} else {
		focusedId.value = getFirstId(filteredItems.value[0]) ?? null
	}

	ev.stopPropagation()
	ev.preventDefault()
}

function onKeyArrowUp(ev: KeyboardEvent) {
	if (focusedId.value) {
		const prevId = getPrevId(props.items, focusedId.value)
		focusedId.value = prevId ?? focusedId.value
	} else {
		focusedId.value = getFirstId(filteredItems.value[0]) ?? null
	}

	ev.stopPropagation()
	ev.preventDefault()
}

function selectedFocusedItem(ev: Event) {
	if (focusedId.value) {
		console.log("Grabbing Focused", focusedId.value)
		const item = getItemById(props.items, focusedId.value)
		if (item) {
			item.command?.({
				originalEvent: ev,
				item,
			})
		}
	} else if (filteredItems.value.length > 0) {
		console.log("Grabbing First")
		const firstId = getFirstId(filteredItems.value[0])
		if (firstId) {
			const item = getItemById(filteredItems.value, firstId)
			if (item) {
				item.command?.({
					originalEvent: ev,
					item,
				})
			}
		}
	}
	hide()
	ev.stopPropagation()
	ev.preventDefault()
}

function onKeyDown(ev: KeyboardEvent) {
	if (ev.key == "ArrowDown") {
		onKeyArrowDown(ev)
	} else if (ev.key == "ArrowUp") {
		onKeyArrowUp(ev)
	} else if (ev.key == "Enter") {
		selectedFocusedItem(ev)
	} else if (ev.key == "Escape") {
		hide()
		ev.stopPropagation()
		ev.preventDefault()
	}
}

function onMouseDown(ev: MouseEvent) {
	ev.stopPropagation()
}
</script>

<style scoped>
.filter-palette.p-menu {
	position: absolute;
	left: var(--page-x);
	top: var(--page-y);
	padding: 0;
}
.filter-palette ul {
	margin: 0;
	list-style: none;
}

.filter-palette .p-menu-start {
	padding: 0.5rem;
}

.filter-palette .p-menuitem-content {
	display: flex;
}

.filter-palette .p-menuitem-text {
	line-height: 1;
}

.filter-palette .p-menuitem-link {
	cursor: pointer;
	display: flex;
	align-items: center;
	text-decoration: none;
	overflow: hidden;
	position: relative;
}

.p-menu-list {
	overflow-y: auto;
	max-height: 15rem;
	padding: 0.5rem;
}
</style>
