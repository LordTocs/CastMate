<template>
	<template v-if="templateMode">
		<p-input-text :input-id="inputId" v-model="(model as any)" v-bind="$attrs" />
		<!-- <p-button class="flex-none no-focus-highlight" icon="mdi mdi-code-json" size="small" text /> -->
	</template>
	<slot v-else v-bind="$attrs"> </slot>
</template>

<script setup lang="ts" generic="T">
import { useModel } from "vue"
import PInputText from "primevue/inputtext"
import PButton from "primevue/button"

const props = defineProps<{
	modelValue: T | string | undefined
	templateMode: boolean
	inputId: string
}>()

const model = useModel(props, "modelValue")
</script>
