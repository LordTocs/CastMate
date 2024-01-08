<template>
	<drop-down-panel
		v-model="model"
		:container="container"
		:style="{
			width: `${containerSize.width.value}px`,
			overflowY: 'auto',
			maxHeight: '15rem',
		}"
	>
		<ul class="p-dropdown-items">
			<template v-for="(group, i) in groupedItems">
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
import { useElementSize } from "@vueuse/core"
import DropDownPanel from "./DropDownPanel.vue"
import { computed, useModel } from "vue"
import {
	AutocompleteItemProps,
	ItemType,
	getItemText,
	getNextItem,
	getPrevItem,
	findItem,
} from "../../../util/autocomplete-helpers"

const props = defineProps<
	{
		modelValue: boolean
		container: HTMLElement | undefined | null
		groupedItems: ItemType[][]
		currentId?: string
		focusedId?: string
	} & AutocompleteItemProps
>()

const emit = defineEmits(["update:modelValue", "update:focusedId", "select", "closed"])
const model = useModel(props, "modelValue")
const focusedId = useModel(props, "focusedId")

const containerSize = useElementSize(() => props.container)

function isItemFocused(item: ItemType) {
	return item.id == props.focusedId
}

function isCurrentItem(item: ItemType) {
	return props.currentId == item.id
}

function close() {
	model.value = false
	emit("closed")
}

function onItemSelect(ev: Event, item: ItemType) {
	emit("select", item)
	close()
	ev.stopPropagation()
	ev.preventDefault()
}

function selectFocusedItem(ev: Event) {
	let item = findItem(props.groupedItems, props.focusedId)
	console.log("Focused?", item)
	if (item == null) {
		item = props.groupedItems[0]?.[0]
	}
	console.log("Focused!", item)

	if (item) {
		ev.stopPropagation()
		ev.preventDefault()
		emit("select", item)
		close()
	}
}

defineExpose({
	handleKeyEvent(ev: KeyboardEvent) {
		if (ev.key == "ArrowDown") {
			focusedId.value = getNextItem(props.groupedItems, focusedId.value)
			ev.stopPropagation()
			ev.preventDefault()
		} else if (ev.key == "ArrowUp") {
			focusedId.value = getPrevItem(props.groupedItems, focusedId.value)
			ev.stopPropagation()
			ev.preventDefault()
		} else if (ev.key == "Enter") {
			selectFocusedItem(ev)
		} else if (ev.key == "Escape") {
			close()
			ev.preventDefault()
			ev.stopPropagation()
		}
	},
})
</script>

<style scoped></style>