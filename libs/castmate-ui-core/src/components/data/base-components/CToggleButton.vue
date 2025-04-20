<template>
	<p-button :severity="model ? onSeverity : offSeverity" @click="onClick" :size="size" ref="button">
		<slot name="off" v-if="!model">
			<i v-if="offIcon" :class="offIcon" /><span v-if="label">{{ label }}</span>
		</slot>
		<slot name="on" v-if="model">
			<i v-if="onIcon" :class="onIcon" /><span v-if="label">{{ label }}</span>
		</slot>
	</p-button>
</template>

<script setup lang="ts">
import PButton from "primevue/button"
import { useDataBinding, useDataUIBinding, usePropagationStop, useUndoCommitter } from "../../../main"
import { ref } from "vue"

const props = defineProps<{
	offSeverity?: "secondary" | "success" | "info" | "warn" | "help" | "danger" | "contrast"
	onSeverity?: "secondary" | "success" | "info" | "warn" | "help" | "danger" | "contrast"
	size?: "small" | "large"
	offIcon?: string
	onIcon?: string
	label?: string
	localPath?: string
}>()

useDataBinding(() => props.localPath)

const model = defineModel<boolean>({ required: true, default: false })
const undoModel = useUndoCommitter(model)

const stopPropagation = usePropagationStop()

const button = ref<InstanceType<typeof PButton> & { $el: HTMLElement }>()

function onClick(ev: MouseEvent) {
	undoModel.value = !model.value
	stopPropagation(ev)
}

useDataUIBinding({
	focus() {
		button.value?.$el.focus()
	},
	scrollIntoView() {
		button.value?.$el.scrollIntoView()
	},
})
</script>
