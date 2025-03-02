<template>
	<div class="flex-grow-1">
		<number-field local-path="min" v-model="model" :placeholder="placeholder" class="w-full" />
	</div>
</template>

<script setup lang="ts">
import NumberField from "../NumberField.vue"
import CContextMenu from "../../../util/CContextMenu.vue"
import { ref } from "vue"
import { useDataBinding, useDataUIBinding } from "../../../../main"

const props = defineProps<{
	localPath: string
	placeholder: string
}>()

useDataBinding(() => props.localPath)

const model = defineModel<number | undefined>({ required: true })
/*
const menu = ref<InstanceType<typeof CContextMenu>>()

function onContextMenu(event: MouseEvent) {
	menu.value?.show(event)
}*/
</script>
