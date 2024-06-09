<template>
	<span class="data-label" v-if="schema.name">{{ schema.name }}:</span>
	<span class="inline-flex vertical-align-middle flex-row align-items-center" v-if="categoryDisplayData">
		<img class="box-art" :src="categoryDisplayData.image" />
		<span> {{ categoryDisplayData.name }}</span>
	</span>
</template>

<script setup lang="ts">
import { SchemaTwitchCategory, TwitchCategoryUnresolved } from "castmate-plugin-twitch-shared"
import { SharedDataViewProps } from "castmate-ui-core"
import { computedAsync } from "@vueuse/core"
import { useCategoryStore } from "../../util/category"

const props = defineProps<
	{
		modelValue: TwitchCategoryUnresolved | undefined
		schema: SchemaTwitchCategory
	} & SharedDataViewProps
>()

const categoryStore = useCategoryStore()

const categoryDisplayData = computedAsync(async () => {
	if (props.modelValue == null) return undefined
	return await categoryStore.getCategoryById(props.modelValue)
})
</script>

<style scoped>
.box-art {
	display: inline-block;
	height: 2em;
	margin-right: 0.5em;
}
</style>
