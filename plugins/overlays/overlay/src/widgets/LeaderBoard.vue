<template>
	<div class="table-container">
		<table>
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
				<template v-for="(varSpec, i) in props.config.variables">
					<td
						v-if="row[varSpec.variable] != null"
						:style="{
							...OverlayTextStyle.toCSSProperties(varSpec.font),
							...OverlayBlockStyle.toCSSPadding(varSpec.block),
							...getBackgroundCSS(varSpec.background, mediaResolver),
							...OverlayTextAlignment.toCSSProperties(varSpec.textAlign),
						}"
					>
						<schema-span v-if="variables[i]" :value="row[varSpec.variable]" :schema="variables[i].schema" />
						<span v-else>{{ row[varSpec.variable] }}</span>
					</td>
				</template>
			</tr>
		</table>
	</div>
</template>

<script setup lang="ts">
import {
	declareWidgetOptions,
	useMediaResolver,
	useViewerDataTable,
	useViewerVariableSchemas,
} from "castmate-overlay-core"
import {
	getBackgroundCSS,
	OverlayBlockStyle,
	OverlayTextAlignment,
	OverlayTextStyle,
	WidgetBackgroundStyle,
} from "castmate-plugin-overlays-shared"
import { ViewerVariableName } from "castmate-schema"
import { computed } from "vue"
import SchemaSpan from "../components/SchemaSpan.vue"

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

const variableNames = computed(() => props.config.variables.map((v) => v.variable))

const variables = useViewerVariableSchemas(variableNames)

const tableData = useViewerDataTable(
	"twitch",
	variableNames,
	() => props.config.sortBy,
	() => props.config.sortOrder,
	() => props.config.count
)
</script>

<style scoped>
.table-container {
	width: 100%;
	height: 100%;
}

.table-container table {
	width: 100%;
	max-height: 100%;
	border-spacing: 0;
}

.table-container td {
	border: 0;
	margin: 0;
}
</style>
