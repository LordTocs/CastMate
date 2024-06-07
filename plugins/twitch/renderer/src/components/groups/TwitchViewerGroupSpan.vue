<template>
	<span>
		<template v-for="(item, i) of spanItems">
			<span v-if="typeof item == 'string'">{{ item }}</span>
			<span v-else-if="isGroupSpanGroupResource(item)">{{
				groupResources?.resources?.get(item.id)?.config?.name
			}}</span>
			<twitch-viewer-span v-else-if="isGroupSpanViewer(item)" :viewer="item.viewer" />
			<span v-if="i != spanItems.length - 1">, </span>
		</template>
	</span>
</template>

<script setup lang="ts">
import { TwitchViewerGroup } from "castmate-plugin-twitch-shared"
import { computed } from "vue"
import { getGroupSpanItems, isGroupSpanGroupResource, isGroupSpanViewer } from "../../util/group"
import { useResource, useResourceData } from "castmate-ui-core"
import TwitchViewerSpan from "../viewer/TwitchViewerSpan.vue"

const props = withDefaults(
	defineProps<{
		group: TwitchViewerGroup | undefined
		maxItems?: number
	}>(),
	{
		maxItems: 5,
	}
)

const groupResources = useResourceData("CustomTwitchViewerGroup")

const spanItems = computed(() => {
	const items = getGroupSpanItems(props.group)

	if (items.length <= props.maxItems) {
		return items
	}

	items.slice(0, props.maxItems)

	return [...items, "..."]
})
</script>

<style scoped></style>
