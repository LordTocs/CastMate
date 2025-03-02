<template>
	<li
		v-for="(item, i) in items"
		class="p-menu-item"
		:class="{ 'p-focus': isItemFocused(item), 'p-highlight': isCurrentItem(item) }"
		:style="item.style"
		:key="item.key"
		:data-p-highlight="isCurrentItem(item)"
		:data-p-focused="isItemFocused(item)"
		:aria-label="getItemText(item)"
		:aria-selected="isCurrentItem(item)"
		:ref="(el) => setRef(i, el as HTMLElement)"
	>
		<div class="p-menu-item-content" :style="item.style" @click="emit('itemSelect', $event, item)">
			<slot name="item" :item="item">
				<a class="p-menu-item-link">
					<i v-if="item.icon" :class="['p-menu-item-icon', item.icon]"></i>
					<span class="p-menu-item-text">
						{{ getItemText(item) }}
					</span>
				</a>
			</slot>
		</div>
	</li>
</template>

<script setup lang="ts">
import { MenuItem } from "primevue/menuitem"
import { onMounted, toValue, watch } from "vue"
import { useOrderedRefs } from "../drag/OrderedTemplateRefs"

const props = defineProps<{
	items: MenuItem[]
	focusedId?: string
}>()

const { orderedElements, setRef } = useOrderedRefs<HTMLElement>(() => props.items)

const emit = defineEmits(["itemSelect"])

function isItemFocused(item: MenuItem) {
	return item.key == props.focusedId
}

function isCurrentItem(item: MenuItem) {
	//@ts-ignore prime-vue has mistyped their function
	return false
}

function getItemText(item: MenuItem) {
	return toValue(item.label) ?? ""
}

onMounted(() => {
	watch(
		() => props.focusedId,
		() => {
			const idx = props.items.findIndex((i) => i.key == props.focusedId)

			if (idx < 0) return

			orderedElements.value[idx]?.scrollIntoView({ block: "nearest" })
		}
	)
})
</script>
