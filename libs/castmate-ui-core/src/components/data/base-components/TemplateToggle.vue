<template>
	<template v-if="templateMode">
		<p-input-text id="l" v-model="(model as any)" v-bind="$attrs" />
	</template>
	<slot v-else v-bind="$attrs"> </slot>
</template>

<script setup lang="ts" generic="T">
import { useModel } from "vue"
import PInputText from "primevue/inputtext"

const props = defineProps<{
	modelValue: T | string | undefined
	templateMode: boolean
}>()

const model = useModel(props, "modelValue")
</script>
