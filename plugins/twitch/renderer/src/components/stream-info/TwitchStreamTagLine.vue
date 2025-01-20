<template>
	<p-input-group>
		<template-toggle v-model="model" :template-mode="template" v-slot="templateProps" ref="templateToggle">
			<p-input-text v-model="model" v-bind="templateProps" ref="inputText" />
		</template-toggle>
		<p-button icon="mdi mdi-delete" severity="secondary" @click="emit('delete')" />
	</p-input-group>
</template>

<script setup lang="ts">
import { TemplateToggle, useDataBinding, useDataUIBinding } from "castmate-ui-core"

import PInputText from "primevue/inputtext"
import PButton from "primevue/button"
import PInputGroup from "primevue/inputgroup"
import { ref } from "vue"

const props = defineProps<{
	template?: boolean
	localPath: string
}>()

const model = defineModel<string>()

const emit = defineEmits(["delete"])

useDataBinding(() => props.localPath)

const inputText = ref<InstanceType<typeof PInputText> & { $el: HTMLElement }>()

useDataUIBinding({
	focus() {
		inputText.value?.$el.focus()
	},
	scrollIntoView() {
		inputText.value?.$el.scrollIntoView()
	},
})
</script>
