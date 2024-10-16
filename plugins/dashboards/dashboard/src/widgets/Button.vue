<template>
	<div class="dashboard-button" :style="buttonStyle" @click="onClick">
		{{ config.displayName }}
	</div>
</template>

<script setup lang="ts">
import { declareWidgetOptions, useCallDashboardRPC, useCastMateBridge, useIsEditor } from "castmate-dashboard-core"
import { DashboardWidgetSize } from "castmate-plugin-dashboards-shared"
import { Color } from "castmate-schema"
import { computed, CSSProperties } from "vue"

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
				color: { type: Color, required: true, name: "Color", default: "#FF0000" },
				displayName: { type: String, required: true, name: "Display Name", template: true },
			},
		},
	}),
})

const isEditor = useIsEditor()

const pressButtonRPC = useCallDashboardRPC<(triggerName: string) => any>("pressbutton")

const bridge = useCastMateBridge()

const props = defineProps<{
	config: { triggerName: string; color: Color; displayName: string }
	size: DashboardWidgetSize
}>()

const buttonStyle = computed<CSSProperties>(() => {
	const runTimeCSS: CSSProperties = {
		cursor: "pointer",
	}

	return {
		backgroundColor: props.config.color,
		...(isEditor ? {} : runTimeCSS),
	}
})

function onClick(ev: MouseEvent) {
	if (isEditor) return

	//Fire off RPC
	pressButtonRPC(props.config.triggerName)
}
</script>

<style scoped>
.dashboard-button {
	position: absolute;
	left: 0;
	right: 0;
	top: 0;
	bottom: 0;
	display: flex;
	justify-content: center;
	align-items: center;
	font-family: Impact;
	font-size: 50;
	-webkit-text-stroke-color: black;
	-webkit-text-stroke-width: 3px;
}
</style>
