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
						<img class="twitch-avatar" :src="selectedDisplayData.profilePicture" />
						<span :style="{ color: selectedDisplayData.color }">
							{{ selectedDisplayData.displayName }}</span
						>
					</template>
				</input-box>
				<p-input-text
					v-else
					@blur="onBlur"
					class="p-dropdown-label"
					ref="filterInputElement"
					v-model="nameValue"
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
					<img class="twitch-avatar" :src="item.profilePicture" />
					<span :style="{ color: item.color }"> {{ item.displayName }}</span>
				</li>
			</template>
		</autocomplete-drop-list>
	</div>
</template>

<script setup lang="ts">
import { SharedDataInputProps, AutocompleteDropList, InputBox, LabelFloater } from "castmate-ui-core"
import { TwitchViewerUnresolved, SchemaTwitchViewer, TwitchViewerDisplayData } from "castmate-plugin-twitch-shared"
import { computed, onMounted, ref, useModel, watch, nextTick } from "vue"
import { useViewerStore } from "../../util/viewer"
import _debounce from "lodash/debounce"
import PInputText from "primevue/inputtext"

const props = defineProps<
	{
		modelValue: TwitchViewerUnresolved | undefined
		schema: SchemaTwitchViewer
	} & SharedDataInputProps
>()

const model = useModel(props, "modelValue")

const container = ref<HTMLElement>()

const dropDown = ref<InstanceType<typeof AutocompleteDropList>>()
const dropDownOpen = ref(false)
const focused = ref(false)
const focusedId = ref<string>()

const nameValue = ref("")

const selectedDisplayData = ref<TwitchViewerDisplayData>()

const viewerStore = useViewerStore()

async function queryDisplay() {
	if (props.modelValue == null) {
		selectedDisplayData.value = undefined
	} else {
		selectedDisplayData.value = await viewerStore.getUserById(props.modelValue)
	}
}

const fuzzySuggestions = ref<TwitchViewerDisplayData[]>([])
const filterInputElement = ref<{ $el: HTMLElement } | null>(null)

function onFocus(ev: FocusEvent) {
	//filterValue.value = itemText.value ?? ""
	if (selectedDisplayData.value) {
		nameValue.value = selectedDisplayData.value.displayName
	} else {
		nameValue.value = ""
	}

	focused.value = true
	nextTick(() => {
		filterInputElement.value?.$el?.focus()
	})
}

function onBlur() {
	//filterValue.value = ""
	dropDownOpen.value = false
	focused.value = false
	queryDisplay()
}

const groupedSuggestions = computed<TwitchViewerDisplayData[][]>(() => {
	const result: TwitchViewerDisplayData[][] = []

	const suggestions = fuzzySuggestions.value
	result.push(suggestions)

	return result
})

async function onFilterKeyDown(ev: KeyboardEvent) {
	if (focused.value && !dropDownOpen.value) {
		dropDownOpen.value = true
		if (selectedDisplayData.value) {
			focusedId.value = selectedDisplayData.value.id
		}
	}

	if (dropDownOpen.value && focused.value) {
		if (ev.key == "Enter") {
			const focusedSuggestion = fuzzySuggestions.value.find((s) => s.id == focusedId.value)
			if (!focusedSuggestion) {
				const exactMatch = await viewerStore.getUserByName(nameValue.value)
				if (exactMatch) {
					model.value = exactMatch.id
					onBlur()
					ev.preventDefault()
					ev.stopPropagation()
					return
				}
			}
		}
	}

	dropDown.value?.handleKeyEvent(ev)
}

async function querySuggestions() {
	//queryExactDebounced()
	fuzzySuggestions.value = await viewerStore.fuzzyGetUser(nameValue.value)
}

function onSelect(item: TwitchViewerDisplayData) {
	model.value = item.id
	filterInputElement.value?.$el?.blur()
}

watch(nameValue, () => {
	if (dropDownOpen.value) {
		querySuggestions()
	}
})

onMounted(() => {
	queryDisplay()
})

watch(
	() => props.modelValue,
	() => {
		queryDisplay()
	}
)
</script>

<style scoped>
.container {
	cursor: pointer;
	position: relative;
	user-select: none;
}

.twitch-avatar {
	display: inline-block;
	height: 1em;
	margin-right: 0.5em;
}
</style>
