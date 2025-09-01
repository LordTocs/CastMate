<template>
	<div class="container w-full" ref="container">
		<div class="color-splash" @click="toggle" :style="{ backgroundColor: model?.color }"></div>
	</div>
	<drop-down-panel class="p-1" v-model="overlayVisible" :container="container">
		<c-color-picker v-model="colorModel" alpha />
	</drop-down-panel>
</template>

<script setup lang="ts">
import { WidgetBackgroundStyle } from "castmate-plugin-overlays-shared"
import { Color } from "castmate-schema"
import {
	CColorPicker,
	DropDownPanel,
	InputBox,
	LabelFloater,
	useDataUIBinding,
	useDefaultableModel,
	useOptionalDefaultableModel,
} from "castmate-ui-core"
import { Ref, ref } from "vue"

// Dear Future Tocs: I'm so sorry.

const props = defineProps<{}>()

const model = defineModel<WidgetBackgroundStyle>()
const colorModel = useOptionalDefaultableModel(
	model,
	"color",
	() => ({ color: "#FF0000", elements: [] } as WidgetBackgroundStyle)
) as Ref<Color | undefined>

const overlayVisible = ref(false)

function show() {
	if (!overlayVisible.value) {
		overlayVisible.value = true
	}
}
function hide() {
	overlayVisible.value = false
}
function toggle(ev: MouseEvent) {
	if (ev.button != 0) return

	ev.stopImmediatePropagation()

	if (overlayVisible.value) {
		hide()
	} else {
		show()
	}
}

const container = ref<HTMLElement | null>(null)
const box = ref<InstanceType<typeof InputBox>>()

useDataUIBinding({
	focus() {
		box.value?.inputDiv?.focus()
	},
	scrollIntoView() {
		box.value?.inputDiv?.scrollIntoView()
	},
})
</script>

<style scoped>
.container {
	cursor: pointer;
	position: relative;
	user-select: none;

	display: flex;
	flex-direction: row;
}

.color-splash {
	display: inline-block;
	height: 1em;
	width: 100%;
	border-radius: var(--border-radius);
	vertical-align: bottom;
}
</style>
