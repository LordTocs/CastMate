<template>
	<div class="flex flex-row">
		<div class="flex flex-column flex-grow-1 gap-1">
			<template v-if="model">
				<twitch-stream-tag-line
					v-for="(t, i) in model"
					v-model="model[i]"
					:template="schema.template"
					@delete="model.splice(i, 1)"
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
import { SharedDataInputProps, DataInputBaseMenu, TemplateToggle } from "castmate-ui-core"
import { useModel, ref, computed } from "vue"

import TwitchStreamTagLine from "./TwitchStreamTagLine.vue"

import PButton from "primevue/button"

const props = defineProps<
	{
		schema: SchemaTwitchStreamTags
		modelValue: TwitchStreamTags | undefined
	} & SharedDataInputProps
>()

const model = useModel(props, "modelValue")

const templateMode = ref(false)
const canClear = computed(() => !props.schema.required)

const canAddTag = computed(() => !model.value || model.value.length < 10)

function addTag() {
	if (!model.value) {
		model.value = [""]
	} else {
		model.value.push("")
	}
}
</script>

<style scoped></style>
