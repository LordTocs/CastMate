<template>
	<p-input-text v-model="edit" v-keyfilter.hex @focus="onFocus" @blur="onBlur" ref="hexInput" />
</template>

<script setup lang="ts">
import { Color, isHexColor } from "castmate-schema"
import PInputText from "primevue/inputtext"
import { computed, onMounted, ref, watch } from "vue"
import { useTextUndoCommitter } from "../../../../main"

const model = defineModel<Color>()

const editModel = ref<string>()

onMounted(() => {
	watch(
		model,
		() => {
			pullModel()
		},
		{ immediate: true }
	)
})

function pullModel() {
	editModel.value = model.value?.slice(1) ?? "#FFFFFF"
}

function pushModel() {
	const hexed = "#" + editModel.value
	if (isHexColor(hexed)) {
		model.value = hexed
	}
}

const edit = computed({
	get() {
		return editModel.value
	},
	set(v) {
		editModel.value = v
		pushModel()
	},
})

function onFocus(ev: FocusEvent) {}

function onBlur(ev: FocusEvent) {
	if (!editModel.value || !isHexColor(editModel.value)) {
		pullModel()
	}
}

const hexInput = ref<InstanceType<typeof PInputText> & { $el: HTMLElement }>()

useTextUndoCommitter(() => hexInput.value?.$el)
</script>
