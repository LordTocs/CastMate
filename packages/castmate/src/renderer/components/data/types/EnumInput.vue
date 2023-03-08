<template>
	<v-autocomplete
		v-if="isAutocomplete && !template"
		v-model.lazy="modelObj"
		:items="enumItems"
		:loading="loading"
		:label="label"
		:search-input.sync="search"
		:clearable="clearable"
		item-value="value"
		item-title="name"
		@focus="fetchItems"
		:density="density"
		:menu-props="{ maxHeight: 200, location: 'bottom' }"
	/>
	<v-combobox
		v-else-if="isAutocomplete && template"
		v-model.lazy="modelObj"
		:items="enumItems"
		:loading="loading"
		:label="label"
		:search-input.sync="search"
		:clearable="clearable"
		@focus="fetchItems"
		:density="density"
		:menu-props="{ maxHeight: 200, location: 'bottom' }"
	/>
	<v-select
		v-else
		:items="this.enum"
		:label="label"
		:loading="loading"
		item-value="value"
		item-title="name"
		dense
		v-model.lazy="modelObj"
		:density="density"
		:menu-props="{ maxHeight: 200, location: 'bottom' }"
	/>
</template>

<script>
import { ipcRenderer } from "electron"
import { mapModel } from "../../../utils/modelValue"
import _cloneDeep from "lodash/cloneDeep"
export default {
	props: {
		modelValue: {},
		enum: {},
		queryMode: { type: Boolean, default: () => false },
		label: { type: String },
		clearable: { type: Boolean, default: () => false },
		template: { type: Boolean, default: () => false },
		context: {},
		density: { tyep: String },
	},
	computed: {
		isAutocomplete() {
			return typeof this.enum == "string" || this.enum instanceof String
		},
		...mapModel(),
	},
	data() {
		return {
			search: "",
			allItems: [],
			enumItems: [],
			loading: false,
		}
	},
	methods: {
		isString(obj) {
			return typeof obj == "string" || obj instanceof String
		},
		getName(item) {
			if (this.isString(item)) return item
			return item.name
		},
		filterArray(search, arr) {
			return search
				? arr.filter((i) =>
						this.getName(i)
							.toLowerCase()
							.includes(search.toLowerCase())
				  )
				: arr
		},
		async fetchItems() {
			if (this.isAutocomplete && !this.queryMode) {
				this.loading = true

				try {
					const items = await ipcRenderer.invoke(
						this.enum,
						_cloneDeep(this.context)
					)

					this.allItems = items
					this.enumItems = items
					this.loading = false
				} catch (err) {
					console.error(
						"Error getting enum items from main process",
						err
					)
				}
			}
		},
	},
	watch: {
		async search(newValue) {
			if (this.loading) return

			this.loading = true
			if (this.isAutocomplete) {
				this.enumItems = this.filterArray(newValue, this.allItems)
			} else {
				const items = await ipcRenderer.invoke(
					this.enum,
					newValue,
					this.context
				)
				this.enumItems = items
			}
			this.loading = false
		},
	},
	async mounted() {
		await this.fetchItems()
	},
}
</script>

<style></style>
