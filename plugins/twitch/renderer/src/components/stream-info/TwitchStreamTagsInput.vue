<template>
	<div class="flex flex-row">
		<div class="flex flex-column flex-grow-1 gap-1">
			<template v-if="model">
				<twitch-stream-tag-line
					v-for="(t, i) in model"
					v-model="model[i]"
					:template="schema.template"
					@delete="deleteTag(i)"
					:local-path="`[${i}]`"
				/>
			</template>
			<p-button severity="secondary" size="small" v-if="canAddTag" @click="addTag"> Add Tag</p-button>
		</div>
		<data-input-base-menu
			v-model="model"
			v-model:template-mode="templateMode"
			ref="inputMenu"
			:can-template="false"
			:can-clear="canClear"
			:disabled="disabled"
		/>
	</div>
</template>

<script setup lang="ts">
import { SchemaTwitchStreamTags, TwitchStreamTags } from "castmate-plugin-twitch-shared"
import {
	SharedDataInputProps,
	DataInputBaseMenu,
	DataBindingPath,
	TemplateToggle,
	useDataBinding,
	useCommitUndo,
} from "castmate-ui-core"
import { useModel, ref, computed } from "vue"

import TwitchStreamTagLine from "./TwitchStreamTagLine.vue"

import PButton from "primevue/button"

const props = defineProps<
	{
		schema: SchemaTwitchStreamTags
		modelValue: TwitchStreamTags | undefined
	} & SharedDataInputProps
>()

useDataBinding(() => props.localPath)

const model = useModel(props, "modelValue")

const templateMode = ref(false)
const canClear = computed(() => !props.schema.required)

const canAddTag = computed(() => !model.value || model.value.length < 10)

const commitUndo = useCommitUndo()

function deleteTag(index: number) {
	model.value?.splice(index, 1)
	commitUndo()
}

function addTag() {
	if (!model.value) {
		model.value = [""]
	} else {
		model.value.push("")
	}
	commitUndo()
}
</script>

<style scoped></style>
