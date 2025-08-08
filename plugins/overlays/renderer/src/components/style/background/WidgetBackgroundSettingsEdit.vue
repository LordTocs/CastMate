<template>
	<div class="background-settings">
		<data-binding-path local-path="repeat">
			<label class="setting-label text-color-secondary">Repeat</label>
			<div class="setting-left">
				<c-select-button
					v-model="repeatHorizontal"
					:options="['repeat', 'no-repeat']"
					local-path="horizontal"
					size="small"
				>
					<template #option="slotProps">
						<i :class="repeatIcons[slotProps.option]"></i>
					</template>
				</c-select-button>
			</div>
			<div class="setting-right">
				<c-select-button
					v-model="repeatVertical"
					:options="['repeat', 'no-repeat']"
					local-path="vertical"
					size="small"
				>
					<template #option="slotProps">
						<i :class="repeatIcons[slotProps.option]"></i>
					</template>
				</c-select-button>
			</div>
		</data-binding-path>

		<data-binding-path local-path="position">
			<label class="setting-label text-color-secondary">Position</label>
			<div class="setting-left">
				<c-select-button
					v-model="positionHorizontal"
					:options="['left', 'center', 'right']"
					local-path="horizontal"
					size="small"
				>
					<template #option="slotProps">
						<i :class="positionHIcons[slotProps.option]"></i>
					</template>
				</c-select-button>
			</div>
			<div class="setting-right">
				<c-select-button
					v-model="positionVertical"
					:options="['top', 'center', 'bottom']"
					local-path="horizontal"
					size="small"
				>
					<template #option="slotProps">
						<i :class="positionVIcons[slotProps.option]"></i>
					</template>
				</c-select-button>
			</div>
		</data-binding-path>

		<data-binding-path local-path="size">
			<label class="setting-label text-color-secondary">Size</label>
			<div class="setting-left">
				<c-select-button v-model="sizeMode" :options="['contain', 'cover', 'sizing']" size="small">
					<template #option="slotProps">
						<i :class="sizeIcons[slotProps.option]"></i>
					</template>
				</c-select-button>
			</div>
			<div class="setting-right flex flex-row gap-1">
				<template v-if="sizeMode == 'sizing'">
					<number-field v-model="sizeHorizontal" size="small" style="width: 50%" />
					<number-field v-model="sizeVertical" size="small" style="width: 50%" />
				</template>
			</div>
		</data-binding-path>
	</div>
</template>

<script setup lang="ts">
import { WidgetBackgroundRepeat, WidgetBackgroundSettings } from "castmate-plugin-overlays-shared"

import {
	CSelectButton,
	useOptionalDefaultableModel,
	DataBindingPath,
	NumberField,
	useDefaultableModel,
} from "castmate-ui-core"
import { computed } from "vue"

const props = defineProps<{}>()
const model = defineModel<WidgetBackgroundSettings>()

const repeat = useDefaultableModel(model, "repeat", undefined, () => ({} as WidgetBackgroundSettings))
const repeatHorizontal = useOptionalDefaultableModel(repeat, "horizontal", () => ({
	horizontal: "repeat",
	vertical: "repeat",
}))
const repeatVertical = useOptionalDefaultableModel(repeat, "vertical", () => ({
	horizontal: "repeat",
	vertical: "repeat",
}))
const repeatIcons: Record<string, string> = {
	repeat: "mdi mdi-repeat",
	"no-repeat": "mdi mdi-repeat-off",
}

const position = useDefaultableModel(model, "position", undefined, () => ({} as WidgetBackgroundSettings))
const positionHorizontal = useOptionalDefaultableModel(position, "horizontal", () => ({
	horizontal: "left",
	vertical: "top",
}))
const positionVertical = useOptionalDefaultableModel(position, "vertical", () => ({
	horizontal: "left",
	vertical: "top",
}))
const positionHIcons: Record<string, string> = {
	left: "mdi mdi-format-horizontal-align-left",
	center: "mdi mdi-format-horizontal-align-center",
	right: "mdi mdi-format-horizontal-align-right",
}
const positionVIcons: Record<string, string> = {
	top: "mdi mdi-format-vertical-align-top",
	center: "mdi mdi-format-vertical-align-center",
	bottom: "mdi mdi-format-vertical-align-bottom",
}

const size = useDefaultableModel(model, "size", undefined, () => ({} as WidgetBackgroundSettings))
const sizeHorizontal = computed({
	get() {
		if (typeof size.value != "object") return undefined
		return size.value.horizontal
	},
	set(v) {
		if (!v) {
			//size.value = undefined
			return
		}

		if (typeof size.value != "object") {
			size.value = {
				horizontal: v,
				vertical: 100,
			}
		} else {
			size.value.horizontal = v
		}
	},
})
const sizeVertical = computed({
	get() {
		if (typeof size.value != "object") return undefined
		return size.value.vertical
	},
	set(v) {
		if (!v) {
			//size.value = undefined
			return
		}

		if (typeof size.value != "object") {
			size.value = {
				horizontal: 100,
				vertical: v,
			}
		} else {
			size.value.vertical = v
		}
	},
})

const sizeMode = computed({
	get() {
		if (size.value == null) return undefined
		if (typeof size.value == "object") {
			return "sizing"
		}
		return size.value
	},
	set(v) {
		if (v == null) {
			size.value = undefined
			return
		}
		if (v == "sizing") {
			size.value = {
				horizontal: 100,
				vertical: 100,
			}
		} else {
			size.value = v
		}
	},
})
const sizeIcons: Record<string, string> = {
	cover: "mdi mdi-image-filter-center-focus",
	contain: "mdi mdi-overscan",
	sizing: "mdi mdi-resize",
}
</script>

<style scoped>
.background-settings {
	display: grid;
	grid-template-columns: 1fr 1fr;
}

.setting-left {
	/* background-color: red; */
}

.setting-right {
	/* background-color: blue; */
}

.setting-label {
	grid-column: 1/3;
	font-size: var(--p-floatlabel-active-font-size);
}

.background-settings :deep(.p-togglebutton-sm .p-togglebutton-content) {
	padding: 0.25rem;
}
</style>
