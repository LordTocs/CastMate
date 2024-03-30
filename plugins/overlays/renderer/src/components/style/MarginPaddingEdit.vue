<template>
	<div class="margin-padding-edit">
		<div
			class="value-edit margin-edit margin-top top-edit"
			ref="marginTop"
			:class="{ 'edit-drag': marginTopDragging }"
			v-if="allowMargin"
		>
			<margin-padding-num-edit v-model="model.margin.top" />
		</div>
		<div
			class="value-edit margin-edit margin-left left-edit"
			ref="marginLeft"
			:class="{ 'edit-drag': marginLeftDragging }"
			v-if="allowMargin"
		>
			<margin-padding-num-edit v-model="model.margin.left" />
		</div>
		<div
			class="value-edit margin-edit margin-right right-edit"
			ref="marginRight"
			:class="{ 'edit-drag': marginRightDragging }"
			v-if="allowMargin"
		>
			<margin-padding-num-edit v-model="model.margin.right" />
		</div>
		<div
			class="value-edit margin-edit margin-bottom bottom-edit"
			ref="marginBottom"
			:class="{ 'edit-drag': marginTopDragging }"
			v-if="allowMargin"
		>
			<margin-padding-num-edit v-model="model.margin.bottom" />
		</div>

		<div
			class="value-edit padding-edit padding-top top-edit"
			ref="paddingTop"
			:class="{ 'edit-drag': paddingTopDragging }"
			v-if="allowPadding"
		>
			<margin-padding-num-edit v-model="model.padding.top" />
		</div>
		<div
			class="value-edit padding-edit padding-left left-edit"
			ref="paddingLeft"
			:class="{ 'edit-drag': paddingLeftDragging }"
			v-if="allowPadding"
		>
			<margin-padding-num-edit v-model="model.padding.left" />
		</div>
		<div
			class="value-edit padding-edit padding-right right-edit"
			ref="paddingRight"
			:class="{ 'edit-drag': paddingRightDragging }"
			v-if="allowPadding"
		>
			<margin-padding-num-edit v-model="model.padding.right" />
		</div>
		<div
			class="value-edit padding-edit padding-bottom bottom-edit"
			ref="paddingBottom"
			:class="{ 'edit-drag': paddingBottomDragging }"
			v-if="allowPadding"
		>
			<margin-padding-num-edit v-model="model.padding.bottom" />
		</div>
	</div>
</template>

<script setup lang="ts">
import { OverlayBlockStyle, OverlayEdgeInfo } from "castmate-plugin-overlays-shared"
import { computed, ref, useModel } from "vue"

import MarginPaddingNumEdit from "./MarginPaddingNumEdit.vue"
import { useDefaulted, useDragValue } from "castmate-ui-core"

const props = withDefaults(
	defineProps<{
		modelValue:
			| {
					margin: OverlayEdgeInfo
					padding: OverlayEdgeInfo
			  }
			| undefined
		allowMargin?: boolean
		allowPadding?: boolean
	}>(),
	{
		allowMargin: true,
		allowPadding: true,
	}
)

const model = useDefaulted(useModel(props, "modelValue"), () => {
	return OverlayBlockStyle.factoryCreate()
})

const marginTop = ref<HTMLElement>()
const marginLeft = ref<HTMLElement>()
const marginRight = ref<HTMLElement>()
const marginBottom = ref<HTMLElement>()

const paddingTop = ref<HTMLElement>()
const paddingLeft = ref<HTMLElement>()
const paddingRight = ref<HTMLElement>()
const paddingBottom = ref<HTMLElement>()

const dragScale = 3

const marginTopDragging = useDragValue(
	marginTop,
	computed({
		get() {
			return model.value.margin.top
		},
		set(v) {
			model.value.margin.top = v
		},
	}),
	{ direction: "vertical", scale: dragScale }
)

const marginLeftDragging = useDragValue(
	marginLeft,
	computed({
		get() {
			return model.value.margin.left
		},
		set(v) {
			model.value.margin.left = v
		},
	}),
	{ direction: "horizontal", scale: dragScale }
)

const marginRightDragging = useDragValue(
	marginRight,
	computed({
		get() {
			return model.value.margin.right
		},
		set(v) {
			model.value.margin.right = v
		},
	}),
	{ direction: "horizontal", scale: dragScale, invert: true, min: 0 }
)

const marginBottomDragging = useDragValue(
	marginBottom,
	computed({
		get() {
			return model.value.margin.bottom
		},
		set(v) {
			model.value.margin.bottom = v
		},
	}),
	{ direction: "vertical", scale: dragScale, invert: true, min: 0 }
)

const paddingTopDragging = useDragValue(
	paddingTop,
	computed({
		get() {
			return model.value.padding.top
		},
		set(v) {
			model.value.padding.top = v
		},
	}),
	{ direction: "vertical", scale: dragScale, min: 0 }
)

const paddingLeftDragging = useDragValue(
	paddingLeft,
	computed({
		get() {
			return model.value.padding.left
		},
		set(v) {
			model.value.padding.left = v
		},
	}),
	{ direction: "horizontal", scale: dragScale, min: 0 }
)

const paddingRightDragging = useDragValue(
	paddingRight,
	computed({
		get() {
			return model.value.padding.right
		},
		set(v) {
			model.value.padding.right = v
		},
	}),
	{ direction: "horizontal", scale: dragScale, invert: true, min: 0 }
)

const paddingBottomDragging = useDragValue(
	paddingBottom,
	computed({
		get() {
			return model.value.padding.bottom
		},
		set(v) {
			model.value.padding.bottom = v
		},
	}),
	{ direction: "vertical", scale: dragScale, invert: true, min: 0 }
)
</script>

<style scoped>
.value-edit {
	position: absolute;
	display: flex;
	justify-content: center;
	align-items: center;

	background-color: var(--surface-b);
	border: solid 1px var(--surface-d);
	border-radius: var(--border-radius);
}

.value-edit.edit-drag {
	background-color: var(--surface-200) !important;
}

.margin-padding-edit {
	position: relative;

	width: 200px;
	height: 150px;

	--edit-width-frac: 0.2;
	--edit-height-frac: 0.23;
	--edit-width: calc(100% * var(--edit-width-frac));
	--edit-height: calc(100% * var(--edit-height-frac));

	--padding-clip-width: calc((100% * var(--edit-width-frac)) / (1 - 2 * var(--edit-width-frac)));
	--padding-clip-height: calc((100% * var(--edit-height-frac)) / (1 - 2 * var(--edit-height-frac)));
}

.margin-edit {
}

.margin-edit:hover {
	background-color: var(--surface-100);
}

.margin-top {
	left: 0;
	top: 0;
	right: 0;
	bottom: calc(100% - var(--edit-height));

	clip-path: polygon(0 0, 100% 0, calc(100% - var(--edit-width)) 100%, var(--edit-width) 100%);
	/* background-color: blue; */
}

.margin-left {
	left: 0;
	top: 0;
	right: calc(100% - var(--edit-width));
	bottom: 0;

	clip-path: polygon(0 0, 100% var(--edit-height), 100% calc(100% - var(--edit-height)), 0 100%);
	/* background-color: red; */
}

.margin-right {
	left: calc(100% - var(--edit-width));
	top: 0;
	right: 0;
	bottom: 0;

	clip-path: polygon(0 var(--edit-height), 100% 0, 100% 100%, 0 calc(100% - var(--edit-height)));
	/* background-color: green; */
}

.margin-bottom {
	left: 0;
	top: calc(100% - var(--edit-height));
	right: 0;
	bottom: 0;

	clip-path: polygon(var(--edit-width) 0, calc(100% - var(--edit-width)) 0, 100% 100%, 0 100%);
	/* background-color: yellow; */
}

.padding-edit {
	position: absolute;
	display: flex;
	justify-content: center;
	align-items: center;

	background-color: var(--surface-b);
	border: solid 1px var(--surface-d);
}

.padding-edit:hover {
	background-color: var(--surface-100);
}

.padding-top {
	left: calc(var(--edit-width));
	top: calc(var(--edit-height));
	right: calc(var(--edit-width));
	bottom: calc(100% - 2 * var(--edit-height));

	clip-path: polygon(0 0, 100% 0, calc(100% - var(--padding-clip-width)) 100%, var(--padding-clip-width) 100%);
	/* background-color: blue; */
}

.padding-left {
	left: calc(var(--edit-width));
	top: calc(var(--edit-height));
	right: calc(100% - 2 * var(--edit-width));
	bottom: calc(var(--edit-height));

	clip-path: polygon(0 0, 100% var(--padding-clip-height), 100% calc(100% - var(--padding-clip-height)), 0 100%);
	/* background-color: red; */
}

.padding-right {
	left: calc(100% - 2 * var(--edit-width));
	top: calc(var(--edit-height));
	right: calc(var(--edit-width));
	bottom: calc(var(--edit-height));

	clip-path: polygon(0 var(--padding-clip-height), 100% 0, 100% 100%, 0 calc(100% - var(--padding-clip-height)));
	/* background-color: green; */
}

.padding-bottom {
	left: calc(var(--edit-width));
	top: calc(100% - 2 * var(--edit-height));
	right: calc(var(--edit-width));
	bottom: calc(var(--edit-height));

	clip-path: polygon(var(--padding-clip-width) 0, calc(100% - var(--padding-clip-width)) 0, 100% 100%, 0 100%);
	/* background-color: yellow; */
}

.top-edit {
	cursor: ns-resize;
}

.left-edit {
	cursor: ew-resize;
}

.right-edit {
	cursor: ew-resize;
}

.bottom-edit {
	cursor: ns-resize;
}
</style>
