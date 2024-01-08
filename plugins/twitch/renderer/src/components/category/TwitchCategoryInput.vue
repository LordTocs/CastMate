<template>
	<div class="container" ref="container">
		<div
			class="p-inputgroup"
			:class="{
				'p-inputwrapper-filled': props.modelValue != null,
			}"
		>
			<label-floater :no-float="noFloat" :label="schema.name" input-id="twitch-viewer" v-slot="labelProps">
				<input-box
					:model="model"
					:focused="focused"
					v-if="!focused"
					@focus="onFocus"
					:tab-index="-1"
					v-bind="labelProps"
				>
					<template v-if="selectedDisplayData">
						<span class="flex flex-row align-items-center">
							<img class="box-art" :src="selectedDisplayData.image" />
							<span> {{ selectedDisplayData.name }}</span>
						</span>
					</template>
				</input-box>
				<p-input-text
					v-else
					@blur="onBlur"
					class="p-dropdown-label"
					ref="filterInputElement"
					v-model="queryValue"
					@keydown="onFilterKeyDown"
					v-bind="labelProps"
				/>
			</label-floater>
		</div>
		<autocomplete-drop-list
			ref="dropDown"
			:container="container"
			:grouped-items="groupedSuggestions"
			v-model="dropDownOpen"
			v-model:focused-id="focusedId"
			text-prop="displayName"
			@select="onSelect"
		>
			<template #item="{ item, focused, highlighted, onClick }">
				<li
					class="p-dropdown-item"
					:class="{ 'p-focus': focused, 'p-highlight': highlighted }"
					:data-p-highlight="highlighted"
					:data-p-focused="focused"
					:aria-label="item.displayName"
					:aria-selected="highlighted"
					@click="onClick"
				>
					<img class="box-art" :src="item.image" />
					<span> {{ item.name }}</span>
				</li>
			</template>
		</autocomplete-drop-list>
	</div>
</template>

<script setup lang="ts">
import PInputText from "primevue/inputtext"
import {
	SchemaTwitchCategory,
	TwitchCategory,
	TwitchCategoryUnresolved,
	TwitchCategoryData,
} from "castmate-plugin-twitch-shared"
import { SharedDataInputProps, AutocompleteDropList, InputBox, LabelFloater } from "castmate-ui-core"
import { computed, onMounted, ref, useModel, watch, nextTick } from "vue"
import { useCategoryStore } from "../../util/category"
import _debounce from "lodash/debounce"

const props = defineProps<
	{
		modelValue: TwitchCategoryUnresolved | undefined
		schema: SchemaTwitchCategory
	} & SharedDataInputProps
>()

const model = useModel(props, "modelValue")

//Component Refs
const container = ref<HTMLElement>()
const filterInputElement = ref<{ $el: HTMLElement } | null>(null)
const dropDown = ref<InstanceType<typeof AutocompleteDropList>>()

const categoryStore = useCategoryStore()

const dropDownOpen = ref(false)
const focused = ref(false)

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

onMounted(() => {
	queryDisplay()
})

watch(
	() => props.modelValue,
	() => {
		queryDisplay()
	}
)

//Focus Events
function onBlur() {
	queryValue.value = ""
	dropDownOpen.value = false
	focused.value = false
	queryDisplay()
}

function onFocus() {
	if (selectedDisplayData.value) {
		queryValue.value = selectedDisplayData.value.name
	} else {
		queryValue.value = ""
	}

	focused.value = true
	nextTick(() => {
		filterInputElement.value?.$el?.focus()
	})
}

function onSelect(item: TwitchCategory) {
	model.value = item.id
	filterInputElement.value?.$el?.blur()
}

//Key Events
async function onFilterKeyDown(ev: KeyboardEvent) {
	if (focused.value && !dropDownOpen.value) {
		dropDownOpen.value = true
		if (selectedDisplayData.value) {
			focusedId.value = selectedDisplayData.value.id
		}
	}

	if (dropDownOpen.value && focused.value) {
		if (ev.key == "Enter") {
			const exactMatch = undefined as TwitchCategoryData | undefined //await viewerStore.getUserByName(nameValue.value)
			if (exactMatch) {
				model.value = exactMatch.id
				onBlur()
				ev.preventDefault()
				ev.stopPropagation()
				return
			}
		}
	}

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
}

.box-art {
	display: inline-block;
	height: 2em;
	margin-right: 0.5em;
}
</style>
