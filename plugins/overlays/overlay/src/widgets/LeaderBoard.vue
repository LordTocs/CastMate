<template>
	<table class="table-container">
		<tr v-for="row in tableData" :key="row.id">
			<td
				:style="{
					...OverlayTextStyle.toCSSProperties(config.nameFont),
					...OverlayBlockStyle.toCSSPadding(config.nameBlock),
					...getBackgroundCSS(config.nameBackground, mediaResolver),
					...OverlayTextAlignment.toCSSProperties(config.nameTextAlign),
				}"
			>
				{{ row.name }}
			</td>
			<td
				v-for="varSpec in props.config.variables"
				:style="{
					...OverlayTextStyle.toCSSProperties(varSpec.font),
					...OverlayBlockStyle.toCSSPadding(varSpec.block),
					...getBackgroundCSS(varSpec.background, mediaResolver),
					...OverlayTextAlignment.toCSSProperties(varSpec.textAlign),
				}"
			>
				{{ row[varSpec.variable] }}
			</td>
		</tr>
	</table>
</template>

<script setup lang="ts">
import { declareWidgetOptions, useMediaResolver, useViewerDataTable } from "castmate-overlay-core"
import {
	getBackgroundCSS,
	OverlayBlockStyle,
	OverlayTextAlignment,
	OverlayTextStyle,
	WidgetBackgroundStyle,
} from "castmate-plugin-overlays-shared"
import { ViewerVariableName } from "castmate-schema"

const mediaResolver = useMediaResolver()

defineOptions({
	widget: declareWidgetOptions({
		id: "leaderboard",
		name: "Leader Board (Beta)",
		description: "Displays viewer data ranked",
		icon: "mdi mdi-table",
		defaultSize: {
			width: 300,
			height: 500,
		},
		config: {
			type: Object,
			properties: {
				sortBy: {
					name: "Sort By",
					type: ViewerVariableName,
					required: true,
				},
				sortOrder: {
					name: "Sort Order",
					type: Number,
					enum: [
						{
							name: "Lowest First",
							value: 1,
						},
						{
							name: "Highest First",
							value: -1,
						},
					],
					required: true,
					default: -1,
				},
				count: {
					name: "Count",
					type: Number,
					required: true,
					default: 10,
					max: 50,
					min: 1,
				},
				variables: {
					name: "Display Variables",
					type: Array,
					items: {
						type: Object,
						properties: {
							variable: { type: ViewerVariableName, required: true, name: "Variable" },
							font: {
								name: "Font",
								type: OverlayTextStyle,
								required: true,
							},
							textAlign: {
								type: OverlayTextAlignment,
								name: "Align",
								required: true,
							},
							background: {
								type: WidgetBackgroundStyle,
								name: "Background",
								required: true,
							},
							block: {
								name: "Block",
								type: OverlayBlockStyle,
								required: true,
								allowMargin: false,
								allowPadding: true,
								allowHorizontalAlign: false,
							},
						},
					},
				},
				nameFont: {
					name: "Name Font",
					type: OverlayTextStyle,
					required: true,
				},
				nameTextAlign: {
					type: OverlayTextAlignment,
					name: "Name Align",
					required: true,
				},
				nameBackground: {
					type: WidgetBackgroundStyle,
					name: "Name Background",
					required: true,
				},
				nameBlock: {
					name: "Block",
					type: OverlayBlockStyle,
					required: true,
					allowMargin: false,
					allowPadding: true,
					allowHorizontalAlign: false,
				},
			},
		},
	}),
})

const props = defineProps<{
	config: {
		variables: {
			variable: string
			font: OverlayTextStyle
			textAlign: OverlayTextAlignment
			background: WidgetBackgroundStyle
			block: OverlayBlockStyle
		}[]
		sortBy: ViewerVariableName
		sortOrder: number
		count: number
		nameFont: OverlayTextStyle
		nameTextAlign: OverlayTextAlignment
		nameBackground: WidgetBackgroundStyle
		nameBlock: OverlayBlockStyle
	}
}>()

const tableData = useViewerDataTable(
	"twitch",
	() => props.config.variables.map((v) => v.variable),
	() => props.config.sortBy,
	() => props.config.sortOrder,
	() => props.config.count
)
</script>

<style scoped>
.table-container {
	width: 100%;
	max-height: 100%;
}
</style>
