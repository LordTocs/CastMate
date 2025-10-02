<template>
	<table class="table-container">
		<tr v-for="row in tableData" :key="row.id">
			<td>{{ row.name }}</td>
			<td v-for="varName in props.config.variables">
				{{ row[varName] }}
			</td>
		</tr>
	</table>
</template>

<script setup lang="ts">
import { declareWidgetOptions, useViewerDataTable } from "castmate-overlay-core"

defineOptions({
	widget: declareWidgetOptions({
		id: "leaderboard",
		name: "Leader Board",
		description: "Displays viewer data ranked",
		icon: "mdi mdi-cursor-text",
		defaultSize: {
			width: 300,
			height: 500,
		},
		config: {
			type: Object,
			properties: {
				variables: {
					name: "Viewer Variables",
					type: Array,
					items: { type: String, required: true },
				},
				sortBy: {
					name: "Sort By",
					type: String,
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
			},
		},
	}),
})

const props = defineProps<{
	config: { variables: string[]; sortBy: string; sortOrder: number; count: number }
}>()

const tableData = useViewerDataTable(
	"twitch",
	() => props.config.variables,
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
</style>
