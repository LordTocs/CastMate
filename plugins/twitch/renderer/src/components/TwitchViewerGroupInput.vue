<template>
	<data-input-base v-model="model" :schema="schema" :toggle-template="false" :local-path="localPath">
		<div class="container w-full" ref="container">
			<input-box :model="model" @click="onClick">
				<span style="white-space: nowrap">
					<twitch-viewer-group-span :group="model" />
				</span>
			</input-box>
		</div>
		<drop-down-panel :container="container" v-model="overlayVisible">
			<twitch-viewer-group-edit v-model="model" :schema="schema" />
		</drop-down-panel>
	</data-input-base>
</template>

<script setup lang="ts">
import { SchemaTwitchViewerGroup, TwitchViewerGroup } from "castmate-plugin-twitch-shared"
import TwitchViewerGroupEdit from "./TwitchViewerGroupEdit.vue"
import { useModel, ref, computed } from "vue"
import {
	useResourceStore,
	DropDownPanel,
	DataInputBase,
	InputBox,
	usePropagationStop,
	useDataBinding,
	SharedDataInputProps,
} from "castmate-ui-core"
import { getGroupPhrase } from "../util/group"
import TwitchViewerGroupSpan from "./groups/TwitchViewerGroupSpan.vue"
const props = defineProps<
	{
		modelValue: TwitchViewerGroup | undefined
		schema: SchemaTwitchViewerGroup
	} & SharedDataInputProps
>()

useDataBinding(() => props.localPath)

const model = useModel(props, "modelValue")

const resourceStore = useResourceStore()
const phrase = computed(() => getGroupPhrase(model.value || {}, resourceStore))

const container = ref<HTMLElement>()

const overlayVisible = ref(false)
function toggle() {
	if (overlayVisible.value) {
		overlayVisible.value = false
	} else {
		overlayVisible.value = true
	}
}

const stopPropagation = usePropagationStop()

function onClick(ev: MouseEvent) {
	toggle()
	stopPropagation(ev)
	ev.preventDefault()
}
</script>

<style scoped>
.container {
	position: relative;
	cursor: pointer;
	user-select: none;

	display: flex;
	flex-direction: row;
}
</style>
