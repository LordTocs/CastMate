<template>
	<div class="dashboard-button" :class="{ 'runtime-button': !isEditor }" :style="buttonStyle" @click="onClick">
		<div class="shadow"></div>
		<div class="front" ref="buttonFront">
			<span class="button-label" ref="buttonLabel">
				{{ config.displayName }}
			</span>
		</div>
	</div>
</template>

<script setup lang="ts">
import * as chromatism from "chromatism2"
import { declareWidgetOptions, useCallDashboardRPC, useCastMateBridge, useIsEditor } from "castmate-dashboard-core"
import { DashboardWidgetSize } from "castmate-plugin-dashboards-shared"
import { Color } from "castmate-schema"
import { computed, CSSProperties, onMounted, ref, watch } from "vue"
import { useElementSize, useMutationObserver } from "@vueuse/core"

defineOptions({
	widget: declareWidgetOptions({
		id: "button",
		name: "Button",
		description: "A button",
		icon: "mdi mdi-gesture-tap-button",
		defaultSize: { width: 2, height: 2 },
		config: {
			type: Object,
			properties: {
				triggerName: { type: String, required: true, name: "Remote Button Trigger Name", template: true },
				color: { type: Color, required: true, name: "Color", default: "#FF0000", template: true },
				displayName: { type: String, required: true, name: "Display Name", template: true },
			},
		},
	}),
})

const isEditor = useIsEditor()

const pressButtonRPC = useCallDashboardRPC<(triggerName: string) => any>("pressbutton")

const props = defineProps<{
	config: { triggerName: string; color: Color; displayName: string }
	size: DashboardWidgetSize
}>()

const darkerColor = computed(() => chromatism.shade(-45, props.config.color).hex)

const buttonStyle = computed<CSSProperties>(() => {
	const runTimeCSS: CSSProperties = {
		cursor: "pointer",
	}

	return {
		"--color": props.config.color,
		"--darker-color": darkerColor.value,
		...(isEditor ? {} : runTimeCSS),
	}
})

const buttonLabel = ref<HTMLElement>()
const buttonFront = ref<HTMLElement>()

const frontSize = useElementSize(buttonFront)

function calculateSize() {
	if (!buttonLabel.value) return

	console.log("Updating SIZE!")

	const buttonLbl = buttonLabel.value

	buttonLabel.value.style.display = "inline-block"
	buttonLabel.value.style.lineHeight = "1px"

	const maxSize = 33
	const minSize = 5

	let fontSize = maxSize
	const stepSize = 0.05
	const lineTarget = 3

	buttonLbl.style.fontSize = fontSize + "cqh"

	buttonLbl.clientWidth

	while (
		(buttonLbl.offsetHeight > lineTarget || buttonLbl.clientWidth > frontSize.width.value) &&
		fontSize > minSize
	) {
		fontSize -= stepSize
		buttonLbl.style.fontSize = fontSize + "cqh"
	}

	//@ts-ignore
	buttonLbl.style.display = null
	//@ts-ignore
	buttonLbl.style.lineHeight = null
}

onMounted(() => {
	watch(
		() => props.config.displayName,
		() => {
			calculateSize()
		},
		{ immediate: true }
	)
})

useMutationObserver(
	buttonLabel,
	() => {
		calculateSize()
	},
	{ subtree: true, characterData: true }
)

function onClick(ev: MouseEvent) {
	if (isEditor) return

	//Fire off RPC
	pressButtonRPC(props.config.triggerName).catch((err) => console.error(err))
}
</script>

<style scoped>
.dashboard-button {
	position: absolute;
	left: 0;
	right: 0;
	top: 0;
	bottom: 0;
}

.shadow {
	position: absolute;
	left: 0;
	right: 0;
	top: 0.85rem;
	bottom: 0;

	background-color: var(--darker-color);
	border-radius: var(--border-radius);
}

.front {
	container: button / size;
	border-radius: var(--border-radius);
	background-color: var(--color);
	position: absolute;
	left: 0;
	right: 0;
	top: 0;
	bottom: 0.75rem;

	padding: 1rem;

	display: flex;
	justify-content: center;
	align-items: center;
}

.runtime-button .front:active {
	top: 0.75rem;
	bottom: 0.15rem;
}

.button-label {
	user-select: none;
	font-family: Impact;
	text-align: center;
	-webkit-text-stroke-color: black;
	-webkit-text-stroke-width: 1px;
}
</style>
