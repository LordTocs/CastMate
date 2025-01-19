<template>
	<data-input-base v-model="model" :schema="schema" v-slot="inputProps" ref="inputBase">
		<filter-input-box
			v-model="model"
			@focus="onFocus"
			@blur="onBlur"
			@filter-key-down="onFilterKeyDown"
			v-bind="inputProps"
			:tab-index="-1"
			v-model:filter="nameValue"
			ref="filterInput"
		>
			<template v-if="selectedDisplayData">
				<img class="twitch-avatar" :src="selectedDisplayData.profilePicture" />
				<span :style="{ color: selectedDisplayData.color }"> {{ selectedDisplayData.displayName }}</span>
			</template>

			<template #append="{ anchor }">
				<autocomplete-drop-list
					ref="dropDown"
					:container="anchor"
					:grouped-items="groupedSuggestions"
					v-model="dropDownOpen"
					v-model:focused-id="focusedId"
					text-prop="displayName"
					@select="onSelect"
				>
					<template #item="{ item, focused, highlighted, onClick }">
						<drop-list-item
							:focused="focused"
							:highlighted="highlighted"
							:label="item.displayName"
							@click="onClick"
						>
							<img class="twitch-avatar" :src="item.profilePicture" />
							<span :style="{ color: item.color }"> {{ item.displayName }}</span>
						</drop-list-item>
					</template>
					<template #empty>
						<div class="text-center p-text-secondary">Type Twitch Name, Hit Enter to Search</div>
					</template>
				</autocomplete-drop-list>
			</template>
		</filter-input-box>
	</data-input-base>
</template>

<script setup lang="ts">
import {
	SharedDataInputProps,
	AutocompleteDropList,
	FilterInputBox,
	DropListItem,
	DataInputBase,
	stopPropagation,
	defaultStringIsTemplate,
} from "castmate-ui-core"
import { TwitchViewerUnresolved, SchemaTwitchViewer, TwitchViewerDisplayData } from "castmate-plugin-twitch-shared"
import { computed, onMounted, ref, useModel, watch, nextTick } from "vue"
import { useViewerStore } from "../../util/viewer"
import _debounce from "lodash/debounce"

const props = defineProps<
	{
		modelValue: TwitchViewerUnresolved | undefined
		schema: SchemaTwitchViewer
	} & SharedDataInputProps
>()

const model = useModel(props, "modelValue")

const dropDown = ref<InstanceType<typeof AutocompleteDropList>>()
const dropDownOpen = ref(false)
const focusedId = ref<string>()

const nameValue = ref("")

const filterInput = ref<InstanceType<typeof FilterInputBox>>()

const selectedDisplayData = ref<TwitchViewerDisplayData>()

const viewerStore = useViewerStore()

async function queryDisplay() {
	if (!props.modelValue) {
		selectedDisplayData.value = undefined
	} else if (!defaultStringIsTemplate(props.modelValue)) {
		selectedDisplayData.value = await viewerStore.getUserById(props.modelValue)
	} else {
		selectedDisplayData.value = undefined
	}
}

const fuzzySuggestions = ref<TwitchViewerDisplayData[]>([])

function onFocus(ev: FocusEvent) {
	//filterValue.value = itemText.value ?? ""
	if (selectedDisplayData.value) {
		nameValue.value = selectedDisplayData.value.displayName
	} else {
		nameValue.value = ""
	}

	dropDownOpen.value = true
	querySuggestions()
}

function onBlur() {
	//filterValue.value = ""
	dropDownOpen.value = false
	queryDisplay()
}

const groupedSuggestions = computed<TwitchViewerDisplayData[][]>(() => {
	const result: TwitchViewerDisplayData[][] = []

	const suggestions = fuzzySuggestions.value
	if (fuzzySuggestions.value.length > 0) {
		result.push(suggestions)
	}

	return result
})

async function onFilterKeyDown(ev: KeyboardEvent) {
	/*if (focused.value && !dropDownOpen.value) {
		dropDownOpen.value = true
		if (selectedDisplayData.value) {
			focusedId.value = selectedDisplayData.value.id
		}
	}*/

	if (dropDownOpen.value) {
		if (ev.key == "Enter") {
			const focusedSuggestion = fuzzySuggestions.value.find((s) => s.id == focusedId.value)
			if (!focusedSuggestion) {
				const exactMatch = await viewerStore.getUserByName(nameValue.value)
				if (exactMatch) {
					model.value = exactMatch.id
					onBlur()
					filterInput.value?.blur()
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
	filterInput.value?.blur()
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

const inputBase = ref<InstanceType<typeof DataInputBase>>()
</script>

<style scoped>
.container {
	cursor: text;
	position: relative;
	user-select: none;

	display: flex;
	flex-direction: row;
}

.twitch-avatar {
	display: inline-block;
	height: 1em;
	margin-right: 0.5em;
}
</style>
