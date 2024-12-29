<template>
	<drop-down-panel
		v-model="model"
		:container="container"
		:style="{
			width: `${containerSize.width.value}px`,
			overflowY: 'auto',
			maxHeight: '15rem',
		}"
		@mousedown="$event.preventDefault()"
	>
		<ul class="p-select-list">
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
					<drop-list-item
						@click="onItemSelect($event, item)"
						:focused="isItemFocused(item)"
						:highlighted="isCurrentItem(item)"
						:label="getItemText(item, props)"
					>
					</drop-list-item>
				</slot>
			</template>
			<slot name="empty" v-if="isEmpty"> </slot>
		</ul>
	</drop-down-panel>
</template>

<script setup lang="ts">
import { useElementSize } from "@vueuse/core"
import DropDownPanel from "./DropDownPanel.vue"
import { computed, onMounted, useModel, watch } from "vue"
import {
	AutocompleteItemProps,
	ItemType,
	getItemText,
	getNextItem,
	getPrevItem,
	findItem,
	groupItems,
} from "../../../util/autocomplete-helpers"
import { usePropagationStop } from "../../../main"
import DropListItem from "./DropListItem.vue"

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

const isEmpty = computed(() => props.groupedItems.length == 0 || props.groupedItems[0].length == 0)

const stopPropagation = usePropagationStop()

function isItemFocused(item: ItemType) {
	return item.id == props.focusedId
}

function isCurrentItem(item: ItemType) {
	return props.currentId == item.id
}

onMounted(() => {
	watch(model, (val, oldVal) => {
		if (val && !oldVal) {
			//Clear the focused id when the dropdown opens
			focusedId.value = undefined
		}
	})
})

function close() {
	model.value = false
	emit("closed")
}

function onItemSelect(ev: MouseEvent, item: ItemType) {
	if (ev.button != 0) return

	console.log("SELECTING", item)
	emit("select", item)
	close()
	stopPropagation(ev)
	ev.preventDefault()
}

function selectFocusedItem(ev: Event) {
	let item = findItem(props.groupedItems, props.focusedId)
	//console.log("Focused?", item)
	if (item == null) {
		item = props.groupedItems[0]?.[0]
	}
	//console.log("Focused!", item)

	if (item) {
		stopPropagation(ev)
		ev.preventDefault()
		emit("select", item)
		close()
	}
}

defineExpose({
	handleKeyEvent(ev: KeyboardEvent) {
		if (ev.key == "ArrowDown") {
			focusedId.value = getNextItem(props.groupedItems, focusedId.value)
			stopPropagation(ev)
			ev.preventDefault()
		} else if (ev.key == "ArrowUp") {
			focusedId.value = getPrevItem(props.groupedItems, focusedId.value)
			stopPropagation(ev)
			ev.preventDefault()
		} else if (ev.key == "Enter") {
			selectFocusedItem(ev)
		} else if (ev.key == "Escape") {
			close()
			ev.preventDefault()
			stopPropagation(ev)
		}
	},
})
</script>

<style scoped>
.autocomplete-item {
	width: 100%;
	overflow-x: hidden;
}
</style>
