<template>
	<p-input-group>
		<template-toggle v-model="model" :template-mode="template" v-slot="templateProps">
			<p-input-text v-model="model" v-bind="templateProps" />
		</template-toggle>
		<p-button icon="mdi mdi-delete" severity="secondary" @click="emit('delete')" />
	</p-input-group>
</template>

<script setup lang="ts">
import { TemplateToggle } from "castmate-ui-core"

import PInputText from "primevue/inputtext"
import PButton from "primevue/button"
import PInputGroup from "primevue/inputgroup"

const props = defineProps<{
	template?: boolean
}>()

const model = defineModel<string>()

const emit = defineEmits(["delete"])
</script>
