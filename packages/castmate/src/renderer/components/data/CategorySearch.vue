<template>
	<v-autocomplete
		v-model="modelObj"
		:loading="isLoading"
		v-model:search="search"
		:items="categories"
		item-value="id"
		item-title="name"
		prepend-icon="mdi-magnify"
		label="Category"
		:density="density"
		:clearable="clearable"
		:menu-props="{ maxHeight: 200, location: 'bottom' }"
	>
		<template #item="{ item, props }">
			<v-list-item
				v-bind="props"
				:prepend-avatar="item.raw.boxArtUrl"
				:title="item.raw.name"
			/>
		</template>
		<template #selection="{ item }">
			<v-list-item
				:prepend-avatar="item.raw.boxArtUrl"
				:title="item.raw.name"
			/>
		</template>
	</v-autocomplete>
</template>

<script>
import { mapIpcs } from "../../utils/ipcMap"
import { mapModel } from "../../utils/modelValue"

export default {
	props: {
		modelValue: {},
		density: { type: String },
		clearable: { type: Boolean, default: true },
	},
	emits: ["update:modelValue"],
	computed: {
		...mapModel(),
	},
	methods: {
		...mapIpcs("twitch", ["searchCategories", "getCategoryById"]),
		async getSelectedCategory() {
			if (!this.modelValue) {
				this.categories = []
				return
			}
			const cat = await this.getCategoryById(this.modelValue)
			if (cat) {
				this.categories = [cat]
			}
		},
		async searchDebounced(search) {
			if (this._timerId) clearTimeout(this._timerId)

			this._timerId = setTimeout(async () => {
				if (search === "") {
					this.getSelectedCategory()
					return
				}

				this.isLoading = true
				console.log("Searching...")
				const categories = await this.searchCategories(search)
				this.categories = categories
				this.isLoading = false
			}, 500)
		},
	},
	data() {
		return {
			isLoading: false,
			search: null,
			categories: [],
			selectedCategory: null,
		}
	},
	async mounted() {
		await this.getSelectedCategory()
	},
	watch: {
		async search(newSearch) {
			this.searchDebounced(newSearch)
		},
	},
}
</script>

<style></style>
