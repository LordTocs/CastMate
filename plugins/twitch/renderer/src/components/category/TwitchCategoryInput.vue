<template>
	<data-input-base v-model="model" :schema="schema" :no-float="noFloat" v-slot="inputProps">
		<filter-input-box
			v-model="model"
			v-model:filter="queryValue"
			v-bind="inputProps"
			ref="filterBox"
			@blur="onBlur"
			@focus="onFocus"
			@filter-key-down="onFilterKeyDown"
			:undo-bound="false"
		>
			<template v-if="selectedDisplayData">
				<span class="flex flex-row align-items-center">
					<img class="box-art" :src="selectedDisplayData.image" />
					<span> {{ selectedDisplayData.name }}</span>
				</span>
			</template>

			<template #append="{ anchor, filter }">
				<autocomplete-drop-list
					ref="dropDown"
					:container="anchor"
					:grouped-items="groupedSuggestions"
					v-model="dropDownOpen"
					v-model:focused-id="focusedId"
					text-prop="displayName"
					@select="onSelect"
				>
					<template #empty>
						<div class="text-center p-text-secondary">Type Twitch Category Name</div>
					</template>

					<template #item="{ item, focused, highlighted, onClick }">
						<drop-list-item
							:focused="focused"
							:highlighted="highlighted"
							@click="onClick"
							:label="item.displayName"
						>
							<img class="box-art vertical-align-middle" :src="item.image" />
							<span> {{ item.name }}</span>
						</drop-list-item>
					</template>
				</autocomplete-drop-list>
			</template>
		</filter-input-box>
	</data-input-base>
</template>

<script setup lang="ts">
import {
	SchemaTwitchCategory,
	TwitchCategory,
	TwitchCategoryUnresolved,
	TwitchCategoryData,
} from "castmate-plugin-twitch-shared"
import {
	SharedDataInputProps,
	AutocompleteDropList,
	DropListItem,
	DataInputBase,
	FilterInputBox,
	useDataBinding,
	useUndoCommitter,
	useCommitUndo,
} from "castmate-ui-core"
import { computed, onMounted, ref, useModel, watch, nextTick } from "vue"
import { useCategoryStore } from "../../util/category"
import _debounce from "lodash/debounce"

const props = defineProps<
	{
		modelValue: TwitchCategoryUnresolved | undefined
		schema: SchemaTwitchCategory
	} & SharedDataInputProps
>()

useDataBinding(() => props.localPath)

const model = useModel(props, "modelValue")

//Component Refs
const filterBox = ref<InstanceType<typeof FilterInputBox>>()
const dropDown = ref<InstanceType<typeof AutocompleteDropList>>()

const categoryStore = useCategoryStore()

const dropDownOpen = ref(false)

const focusedId = ref<string>()

const queryValue = ref("")

//Display Values
const selectedDisplayData = ref<TwitchCategory>()
async function queryDisplay() {
	if (props.modelValue == null) {
		selectedDisplayData.value = undefined
	} else {
		selectedDisplayData.value = await categoryStore.getCategoryById(props.modelValue)
	}
}

const commitUndo = useCommitUndo()

onMounted(() => {
	watch(
		() => props.modelValue,
		() => {
			queryDisplay()
		},
		{ immediate: true }
	)
})

//Focus Events
function onBlur() {
	console.log("Blur")
	dropDownOpen.value = false
	queryDisplay()
}

function onFocus() {
	console.log("Focus")
	dropDownOpen.value = true
	if (selectedDisplayData.value) {
		queryValue.value = selectedDisplayData.value.name
	} else {
		queryValue.value = ""
	}
}

function onSelect(item: TwitchCategory) {
	console.log("Select!", filterBox.value)
	model.value = item.id
	filterBox.value?.blur()
	commitUndo()
}

//Key Events
async function onFilterKeyDown(ev: KeyboardEvent) {
	dropDown.value?.handleKeyEvent(ev)
}

///Value
const searchSuggestions = ref<TwitchCategory[]>([])
const querySuggestions = _debounce(async () => {
	searchSuggestions.value = await categoryStore.searchCategories(queryValue.value)
}, 400)

const groupedSuggestions = computed<TwitchCategory[][]>(() => {
	const result: TwitchCategory[][] = []

	const suggestions = searchSuggestions.value
	result.push(suggestions)

	return result
})

watch(queryValue, () => {
	console.log(queryValue.value)
	if (dropDownOpen.value) {
		querySuggestions()
	}
})
</script>

<style scoped>
.container {
	cursor: pointer;
	position: relative;
	user-select: none;

	display: flex;
	flex-direction: row;
}

.box-art {
	display: inline-block;
	height: 2em;
	margin-right: 0.5em;
}
</style>
