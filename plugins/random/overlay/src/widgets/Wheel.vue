<template>
	<div
		class="wheel-container"
		:style="{
			'--numSlices': props.config.slices,
			'--radius': `${radius}px`,
			'--sliceHeight': `${sliceHeight}px`,
		}"
	>
		<div class="wheel">
			<div
				v-for="(slice, i) in sliceData"
				class="slice"
				:style="{
					transform: `rotate(${i * (360 / config.slices) + wheelAngle}deg)`,
					'--sliceColor': slice.color,
					clipPath: `path('${clipPath}')`,
				}"
			>
				<div
					class="label"
					:style="{
						...OverlayBlockStyle.toCSSProperties(slice.block),
					}"
				>
					<div
						:style="{
							width: '100%',
							whiteSpace: 'break-spaces',
							...OverlayTextStyle.toCSSProperties(slice.font),
							...OverlayTextAlignment.toCSSProperties(slice.textAlign),
						}"
					>
						{{ slice.text }}
					</div>
				</div>
			</div>
		</div>
		<!-- <div
			class="clicker"
			:style="{
				backgroundColor: clicker?.color || '#A87B0B',
				right: `${-((clicker?.width ?? 40) - (clicker?.inset ?? 10))}px`,
				'--clickerWidth': `${clicker?.width ?? 40}px`,
				'--clickerHeight': `${clicker?.height ?? 20}px`,
				clipPath: `path('${clickerClipPath}')`,
			}"
		></div> -->
	</div>
</template>

<script setup lang="ts">
import { declareWidgetOptions } from "castmate-overlay-core"
import {
	OverlayBlockStyle,
	OverlayTextAlignment,
	OverlayTextStyle,
	OverlayWidgetSize,
} from "castmate-plugin-overlays-shared"
import { Color } from "castmate-schema"
import { computed, onMounted, ref, watch } from "vue"

const defaultStyle = [
	{
		color: "#BA7D00",
		font: {
			fontSize: 45,
			fontColor: "#FFF1CA",
			fontFamily: "Arial Rounded MT",
			fontWeight: 300,
			stroke: {
				width: 2,
				color: "#251600",
			},
		},
		textAlign: OverlayTextAlignment.factoryCreate({ textAlign: "center" }),
		block: OverlayBlockStyle.factoryCreate({ verticalAlign: "center" }),
		//click: "wheelClick.ogg",
	},
	{
		color: "#A70010",
		font: {
			fontSize: 45,
			fontColor: "#FFC5C5",
			fontFamily: "Arial Rounded MT",
			fontWeight: 300,
			stroke: {
				width: 2,
				color: "#270000",
			},
		},
		textAlign: OverlayTextAlignment.factoryCreate({ textAlign: "center" }),
		block: OverlayBlockStyle.factoryCreate({ verticalAlign: "center" }),
		//click: "wheelClick.ogg",
	},
]

defineOptions({
	widget: declareWidgetOptions({
		id: "wheel",
		name: "Wheel",
		description: "A wheel for randomly selecting things",
		icon: "mdi mdi-tire",
		defaultSize: {
			width: 500,
			height: 500,
		},
		config: {
			type: Object,
			properties: {
				slices: { type: Number, default: 12, required: true, name: "Slice Count" },
				items: {
					type: Array,
					name: "Items",
					items: {
						type: Object,
						properties: {
							text: { type: String, name: "Text", required: true },
							colorOverride: { type: Color, name: "Color Override" },
							fontOverride: { type: OverlayTextStyle, name: "Font Override" },
							textAlignOverride: { type: OverlayTextAlignment, name: "Text Align Override" },
							blockOverride: {
								type: OverlayBlockStyle,
								name: "Blocking Override",
								allowMargin: false,
								allowHorizontalAlign: false,
							},
						},
					},
				},
				style: {
					type: Array,
					name: "Slice Styles",
					items: {
						type: Object,
						properties: {
							color: { type: Color, name: "Color", required: true },
							font: { type: OverlayTextStyle, name: "Font", required: true },
							textAlign: { type: OverlayTextAlignment, name: "Text Align", required: true },
							block: {
								type: OverlayBlockStyle,
								name: "Blocking",
								required: true,
								allowMargin: false,
								allowHorizontalAlign: false,
							},
						},
					},
					default: [
						{
							color: "#BA7D00",
							font: {
								fontSize: 45,
								fontColor: "#FFF1CA",
								fontFamily: "Arial Rounded MT",
								fontWeight: 300,
								stroke: {
									width: 2,
									color: "#251600",
								},
							},
							textAlign: OverlayTextAlignment.factoryCreate({ textAlign: "center" }),
							block: OverlayBlockStyle.factoryCreate({ verticalAlign: "center" }),
							//click: "wheelClick.ogg",
						},
						{
							color: "#A70010",
							font: {
								fontSize: 45,
								fontColor: "#FFC5C5",
								fontFamily: "Arial Rounded MT",
								fontWeight: 300,
								stroke: {
									width: 2,
									color: "#270000",
								},
							},
							textAlign: OverlayTextAlignment.factoryCreate({ textAlign: "center" }),
							block: OverlayBlockStyle.factoryCreate({ verticalAlign: "center" }),
							//click: "wheelClick.ogg",
						},
					],
				},
				damping: {
					name: "Braking (Deg Per Second)",
					type: Object,
					properties: {
						base: { type: Number, default: 6, name: "Constant Braking", required: true },
						coefficient: {
							type: Number,
							default: 0.1,
							name: "Multiplied Braking",
							required: true,
						},
					},
				},
			},
		},
	}),
})

interface ItemData {
	text: string
	color: Color
	font: OverlayTextStyle
	textAlign: OverlayTextAlignment
	block: OverlayBlockStyle
}

const props = defineProps<{
	size: OverlayWidgetSize
	config: {
		slices: number
		items: {
			text: string
			colorOverride: Color | undefined
			fontOverride: OverlayTextStyle | undefined
			textAlignOverride: OverlayTextAlignment | undefined
			blockOverride: OverlayBlockStyle | undefined
		}[]
		style: {
			color: Color
			font: OverlayTextStyle
			textAlign: OverlayTextAlignment
			block: OverlayBlockStyle
		}[]
		damping: {
			base: number
			coefficient: number
		}
	}
}>()

///Rendering
const wheelAngle = ref(0)

const radius = computed(() => props.size.width / 2)

//Half of the outside choord's length of a slice
const theta = computed(() => (Math.PI * 2) / sliceCount.value / 2)

const sliceHeight = computed(() => {
	const sinTheta = Math.sin(theta.value)
	return 2 * sinTheta * radius.value
})

//SVG Path to clip a rectangle to one slice
const clipPath = computed(() => {
	const cosTheta = Math.cos(theta.value)

	const width = radius.value
	const height = sliceHeight.value

	const arcPath = `M 0,${height / 2 - 1} L${cosTheta * width},-1 A ${radius.value},${radius.value} ${
		360 / sliceCount.value
	} 0, 1, ${cosTheta * width}, ${height + 1} L 0,${height / 2 + 1} Z`
	return arcPath
})

const degPerSlice = computed(() => 360 / props.config.slices)
const globalIndex = computed(() => Math.ceil((-wheelAngle.value - degPerSlice.value / 2) / degPerSlice.value))

/**
 * Modulus but aware of negative numbers.
 * @param globalPosition
 * @param slices
 * @returns Valid, positive, moduloed index
 */
function slicedLoopIndex(globalPosition: number, slices: number) {
	const idx = Math.ceil(globalPosition) % slices

	return idx < 0 ? slices + idx : idx
}

const itemIndex = computed(() => slicedLoopIndex(globalIndex.value, props.config.items.length ?? 1))
const slotIndex = computed(() => slicedLoopIndex(globalIndex.value, props.config.slices))

const sliceCount = computed(() => props.config.slices ?? 1)
const items = computed(() => props.config.items ?? [])
const style = computed(() => props.config.style ?? defaultStyle)

const sliceData = computed<ItemData[]>(() => {
	const result: ItemData[] = []

	const updateSlotIndex = slicedLoopIndex((-wheelAngle.value - 180) / degPerSlice.value, sliceCount.value)
	const updateItemIndex = slicedLoopIndex((-wheelAngle.value - 180) / degPerSlice.value, sliceCount.value)

	for (let i = 0; i < props.config.slices; ++i) {
		const slotIdx = (updateSlotIndex + i) % sliceCount.value
		const itemIdx = (updateItemIndex + i) % (items.value.length || 1)
		const styleIdx = slicedLoopIndex(slotIdx, style.value.length)

		const item = items.value[itemIdx] ?? { text: "" }
		const sliceStyle = style.value[styleIdx] ?? {
			color: "#BA7D00",
			font: OverlayTextStyle.factoryCreate(),
			textAlign: OverlayTextAlignment.factoryCreate(),
			block: OverlayBlockStyle.factoryCreate(),
		}

		const resultData: ItemData = {
			text: item.text ?? "",
			color: item.colorOverride ?? sliceStyle.color,
			font: item.fontOverride ?? sliceStyle.font,
			textAlign: item.textAlignOverride ?? sliceStyle.textAlign,
			block: item.blockOverride ?? sliceStyle.block,
		}

		result.push(resultData)
	}

	return result
})

/////ANIMATION
const angularVelocity = ref(0)
const lastTimestamp = ref<number>()

function requestNewFrame() {
	window.requestAnimationFrame((ts) => updateWheel(ts))
}
function updateWheel(timestamp: number) {
	if (lastTimestamp.value == null) {
		lastTimestamp.value = timestamp
		requestNewFrame()
		return
	}

	const dt = (timestamp - lastTimestamp.value) / 1000
	lastTimestamp.value = timestamp

	wheelAngle.value += angularVelocity.value * dt

	//Damping
	const dampingBase = props.config.damping?.base ?? 6
	const dampingCoefficient = props.config.damping?.coefficient ?? 0.1

	const lastVelocity = angularVelocity.value
	angularVelocity.value = Math.max(
		angularVelocity.value - (angularVelocity.value * dampingCoefficient + dampingBase) * dt,
		0
	)

	if (angularVelocity.value > 0) {
		requestNewFrame()
	} else {
		if (lastVelocity > 0) {
			//Just Stopped
			//const result = this.items[this.itemIndex]?.text
			//this.callbacks.call("wheelLanded", result)
		}
	}
}

function spinWheel(spinStrength: number) {
	spinStrength = spinStrength * 60 ?? 60

	const needsStart = angularVelocity.value == 0

	angularVelocity.value += spinStrength

	if (needsStart) {
		lastTimestamp.value = undefined
		requestNewFrame()
	}
}
</script>

<style scoped>
.wheel-container {
	--circumfrance: calc(6.283185307 * var(--radius));
	--sliceOffset: calc(var(--sliceHeight) / 2);
	width: calc(2 * var(--radius));
	height: calc(2 * var(--radius));
	position: relative;
}

.wheel {
	height: 100%;
	transform-origin: center center;
	position: relative;
}

.clicker {
	position: absolute;
	width: var(--clickerWidth);
	height: var(--clickerHeight);
	top: calc(var(--radius) - var(--clickerHeight) / 2);
}

.slice {
	transform-origin: left center;
	/* line-height: var(--sliceHeight); */
	position: absolute;
	height: var(--sliceHeight);
	top: calc(50% - var(--sliceOffset));
	left: 50%;
	width: 50%;
	display: block;
	background-color: var(--sliceColor);
}
/*
.slice::before {
    content: "";
    display: block;
    width: 0;
    height: 0;
    border-style: solid;

    margin-bottom: -1px;
    margin-top: -2px;
    border-width: 0 0 calc((var(--sliceHeight) / 2) + 4px) var(--radius);
    border-color: transparent transparent var(--sliceColor) transparent;
}

.slice::after {
    content: "";
    display: block;
    width: 0;
    height: 0;
    border-style: solid;

    margin-top: -1px;
    margin-bottom: -2px;
    border-width: 0 var(--radius) calc((var(--sliceHeight) / 2) + 4px) 0;
    border-color: transparent var(--sliceColor) transparent transparent;
}
*/
.slice .label {
	position: absolute;
	top: 0;
	bottom: 0;
	left: 0;
	right: 0;
}
</style>
