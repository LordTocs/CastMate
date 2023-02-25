<template>
	<v-container fluid>
		<div>
			<h1>SpellCast</h1>
		</div>
		<v-table v-if="extensionActive">
			<thead>
				<tr>
					<th>Enabled</th>
					<th>Spell</th>
					<th></th>
					<th></th>
				</tr>
			</thead>
			<tbody>
				<tr v-for="(spell, i) in spells" :key="spell.id">
					<td class="fitwidth">
						<v-switch
							color="primary"
							:modelValue="spell.config.enabled"
							@update:modelValue="toggleSpell(spell.id, $event)"
						/>
					</td>
					<td class="fitwidth">
						<spell-cast-button-preview
							class="mx-2 my-2"
							:spellId="spell.id"
						/>
					</td>
					<td>
						{{ spell.config.description }}
					</td>
					<td class="fitwidth">
						<v-btn
							size="small"
							icon="mdi-pencil"
							class="mx-1"
							variant="flat"
							@click="dlg.showEdit(spell.id)"
						/>
					</td>
				</tr>
			</tbody>
		</v-table>
		<div v-else>
			<v-btn
				href="https://dashboard.twitch.tv/extensions/d6rcoml9cel8i3y7amoqjsqtstwtun"
				target="_blank"
				>Install SpellCast Extension</v-btn
			>
			<v-btn @click="spellCastStore.checkExtensionStatus()">
				Refresh
			</v-btn>
		</div>
		<resource-dialog resourceTypeId="spell" ref="dlg" />
	</v-container>
</template>

<script setup>
import { computed, ref } from "vue"
import { usePluginStore } from "../store/plugins"
import { useResourceArray, useResourceFunctions } from "../utils/resources"
import ResourceDialog from "../components/dialogs/ResourceDialog.vue"
import SpellCastButtonPreview from "../components/spellcast/SpellCastButtonPreview.vue"

const pluginStore = usePluginStore()
const extensionActive = computed(
	() => pluginStore.rootState.spellcast.extensionActive
)

const spells = useResourceArray("spell")
const spellFuncs = useResourceFunctions("spell")

async function toggleSpell(spellId, enabled) {
	spellFuncs.updateConfig(spellId, { enabled })
}

const dlg = ref(null)
</script>

<style scoped>
td.fitwidth {
	width: 1px;
	white-space: nowrap;
}
</style>
