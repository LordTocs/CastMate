<template>
	<v-card class="linktable-card">
		<div class="d-flex flex-row align-center my-2 mx-2">
			<v-btn color="primary" @click="$emit('create')" class="mr-3">
				Add {{ name }}
			</v-btn>
			<v-text-field
				v-model="search"
				append-inner-icon="mdi-magnify"
				label="Filter"
				single-line
				hide-details
			/>
		</div>
		<v-table>
			<thead>
				<tr>
					<th>
						{{ props.name }}
					</th>
					<th></th>
				</tr>
			</thead>
			<tbody>
				<tr
					v-for="item in filteredItems"
					:key="getId(item)"
					@click="$emit('nav', item)"
				>
					<td>
						<slot name="item" :item="item">
							{{ getName(item) }}</slot
						>
					</td>
					<td class="d-flex flex-row justify-end align-center">
						<slot name="item-input" :item="item"></slot>
					</td>
				</tr>
			</tbody>
		</v-table>
	</v-card>
</template>

<script setup>
import { computed, ref } from "vue"

const search = ref(null)

const props = defineProps({
	name: { type: String },
	items: { type: Array, default: () => [] },
	idProp: { type: String, default: () => "id" },
	nameProp: { type: String, default: () => "name" },
})

function getName(item) {
	if (item instanceof String || typeof item === "string") return item
	return item[props.nameProp]
}

function getId(item) {
	if (item instanceof String || typeof item === "string") return item
	return item?.[props.idProp]
}

const filteredItems = computed(() => {
	let items = [...props.items]

	if (search.value) {
		const searchValue = search.value.toLowercase()
		items = items.filter((i) =>
			getName(i).toLowercase().includes(searchValue)
		)
	}

	items.sort((a, b) => getName(a) - getName(b))
	return items
})
</script>

<style>
.linktable-card tbody tr {
	cursor: pointer;
}

.linktable-card tbody tr:nth-of-type(even) {
	background-color: #424242;
}

.linktable-card tbody tr:nth-of-type(odd) {
	background-color: #424242;
}

.linktable-card .v-data-table-header {
	background-color: #424242;
	color: white;
}

.linktable-card .v-data-footer {
	background-color: #424242;
}
</style>
