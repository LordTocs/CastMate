<template>
	<v-container fluid>
		<v-card v-if="extensionActive">
			<div
				class="d-flex flex-row align-center px-2 py-2 text-h4"
				style="
					background: linear-gradient(
						159deg,
						#000821 0,
						#0373e6 70%,
						#42ff48 100%
					);
					padding-top: 1rem !important;
				"
			>
				<spell-cast-logo />
			</div>
			<v-table>
				<thead>
					<tr>
						<th>Enabled</th>
						<th>Spell</th>
						<th></th>
						<th></th>
					</tr>
				</thead>
				<tbody v-if="spells.length > 0">
					<tr v-for="(spell, i) in spells" :key="spell.id">
						<td class="fitwidth">
							<v-switch
								color="primary"
								:modelValue="spell.config.enabled"
								@update:modelValue="
									toggleSpell(spell.id, $event)
								"
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
		</v-card>
		<spell-cast-extension-card v-else />
		<resource-dialog resourceTypeId="spell" ref="dlg" />
	</v-container>
</template>

<script setup>
import { computed, ref } from "vue"
import { usePluginStore } from "../store/plugins"
import { useResourceArray, useResourceFunctions } from "../utils/resources"
import ResourceDialog from "../components/dialogs/ResourceDialog.vue"
import SpellCastButtonPreview from "../components/spellcast/SpellCastButtonPreview.vue"
import SpellCastExtensionCard from "../components/spellcast/SpellCastExtensionCard.vue"
import SpellCastLogo from "../components/spellcast/SpellCastLogo.vue"

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
