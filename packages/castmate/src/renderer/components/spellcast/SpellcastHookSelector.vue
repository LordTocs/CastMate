<template>
	<v-card-actions>
		<v-autocomplete
			v-model="modelObj"
			:items="items"
			item-title="name"
			item-value="_id"
			:label="label"
			clearable
		>
			<template #append>
				<div class="d-flex flex-row align-center">
					<v-menu bottom right>
						<template v-slot:activator="{ props }">
							<v-btn
								size="small"
								icon="mdi-dots-vertical"
								v-bind="props"
							/>
						</template>
						<v-list>
							<v-list-item link :disabled="!modelValue">
								<v-list-item-title
									@click="$refs.editModal.open()"
								>
									Edit Hook
								</v-list-item-title>
							</v-list-item>
							<v-list-item
								@click="$refs.createModal.open()"
								link
								:disabled="!!modelValue"
							>
								<v-list-item-title>
									Create Hook
								</v-list-item-title>
							</v-list-item>
						</v-list>
					</v-menu>
				</div>
			</template>
		</v-autocomplete>

		<spellcast-hook-modal
			ref="editModal"
			title="Edit Spell Hook"
			:hook="currentItem"
			:showDelete="true"
			@updated="queryItems"
			@deleted="onDelete"
		/>
		<spellcast-hook-modal
			ref="createModal"
			title="Create Spell Hook"
			:showSave="false"
			:showCreate="true"
			:showDelete="false"
			@created="onCreate"
		/>
	</v-card-actions>
</template>

<script>
import { mapIpcs } from "../../utils/ipcMap"
import { mapModel } from "../../utils/modelValue"
import SpellcastHookModal from "./SpellcastHookModal.vue"

export default {
	components: { SpellcastHookModal },
	props: {
		modelValue: {},
		label: { type: String, default: () => "Channel Point Reward" },
		existingRewards: { type: Array, default: () => [] },
	},
	computed: {
		...mapModel(),
		currentItem() {
			return this.items.find((i) => i._id == this.modelValue)
		},
	},
	data() {
		return {
			items: [],
			search: null,
			loading: false,
		}
	},
	methods: {
		...mapIpcs("spellcast", ["getSpellHooks", "getSpellHook"]),
		async queryItems() {
			this.loading = true
			let result = await this.getSpellHooks()
			this.items = result
			this.loading = false
		},
		async onDelete() {
			this.$emit("update:modelValue", undefined)
			await this.queryItems()
		},
		async onCreate(hookId) {
			await this.queryItems()
			this.$emit("update:modelValue", hookId)
		},
	},
	mounted() {
		//this.filter();
		//this.updateItem();
		this.queryItems()
	},
	watch: {
		async modelValue() {
			await this.updateItem()
		},
		async search(newSearch) {
			await this.filter(newSearch)
		},
	},
}
</script>

<style></style>
