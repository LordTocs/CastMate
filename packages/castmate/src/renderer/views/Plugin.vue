<template>
	<div>
		<v-sheet color="grey-darken-4" class="py-4 px-4 d-flex">
			<div class="d-flex flex-column mx-4">
				<v-btn
					color="primary"
					fab
					dark
					class="my-1 align-self-center"
					@click="save"
					:disabled="!dirty"
				>
					<v-icon>mdi-content-save</v-icon>
				</v-btn>
			</div>
			<div class="flex-grow-1">
				<h1>{{ plugin.uiName || plugin.name }}</h1>
			</div>
		</v-sheet>
		<v-container fluid>
			<component
				v-if="hasSettingsComponent"
				v-bind:is="settingsComponent"
				style="margin-bottom: 18px"
			/>
			<v-row v-if="settings && settingKeys.length > 0">
				<v-col>
					<v-card>
						<v-card-title> Settings </v-card-title>

						<v-card-text>
							<data-input
								v-for="settingKey in settingKeys"
								:key="settingKey"
								:schema="
									addRequired(plugin.settings[settingKey])
								"
								:label="settingKey"
								v-model="settings[settingKey]"
							/>
						</v-card-text>
					</v-card>
				</v-col>
			</v-row>
			<v-row v-if="secrets && secretKeys.length > 0">
				<v-col>
					<v-card>
						<v-card-title> Secrets </v-card-title>

						<v-card-text v-if="showSecrets">
							<data-input
								v-for="secretKey in secretKeys"
								:key="secretKey"
								:schema="addRequired(plugin.secrets[secretKey])"
								:label="secretKey"
								v-model="secrets[secretKey]"
								secret
							/>
						</v-card-text>
						<v-card-text v-else>
							<v-sheet
								rounded
								v-for="secretKey in secretKeys"
								:key="secretKey"
								style="min-height: 1em"
								color="grey-darken-3"
								class="my-2"
							>
							</v-sheet>
						</v-card-text>
						<v-card-actions>
							<v-btn @click="showSecrets = !showSecrets">
								{{
									showSecrets
										? "Hide Secrets"
										: "Show Secrets "
								}}
							</v-btn>
						</v-card-actions>
					</v-card>
				</v-col>
			</v-row>
			<v-snackbar v-model="saveSnack" :timeout="1000" color="green">
				Saved
			</v-snackbar>
		</v-container>
		<confirm-dialog ref="saveDlg" />
	</div>
</template>

<script setup>
import DataInput from "../components/data/DataInput.vue"
import ConfirmDialog from "../components/dialogs/ConfirmDialog.vue"
import {
	defineAsyncComponent,
	onMounted,
	watch,
	computed,
	ref,
	nextTick,
} from "vue"
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute } from "vue-router"
import { useIpc } from "../utils/ipcMap"
import { useSettingsStore } from "../store/settings"
import _cloneDeep from "lodash/cloneDeep"
import { usePluginStore } from "../store/plugins"

const route = useRoute()
const settingsStore = useSettingsStore()
const pluginStore = usePluginStore()

const pluginName = computed(() => route.params.pluginName)
const plugin = computed(() => pluginStore.plugins[pluginName.value])

const settingKeys = computed(() => Object.keys(plugin.value.settings))
const secretKeys = computed(() => Object.keys(plugin.value.secrets))

const hasSettingsComponent = computed(() => !!plugin.value.settingsView)
const settingsComponent = computed(() =>
	defineAsyncComponent(() =>
		import(`../components/plugins/${plugin.value.settingsView}.vue`)
	)
)

const dirty = ref(false)
const settings = ref(null)
const secrets = ref(null)
const showSecrets = ref(false)

watch(
	settings,
	(newValue, oldValue) => {
		if (oldValue) dirty.value = true
	},
	{ deep: true }
)
watch(
	secrets,
	(newValue, oldValue) => {
		if (oldValue) dirty.value = true
	},
	{ deep: true }
)

async function load() {
	const fullSettings = _cloneDeep(settingsStore.settings)
	const fullSecrets = _cloneDeep(settingsStore.secrets)

	settings.value = fullSettings[pluginName.value] || {}
	secrets.value = fullSecrets[pluginName.value] || {}

	nextTick(() => {
		dirty.value = false
	}) //Wait for the dirty watches to finish to undirty it for initial
}

const saveDlg = ref(null)
//Auto mark things as dirty
const changeSettings = useIpc("settings", "changeSettings")
const changeSecrets = useIpc("settings", "changeSecrets")

const saveSnack = ref(false)
async function save() {
	await Promise.all([
		changeSettings(pluginName.value, settings.value),
		changeSecrets(pluginName.value, secrets.value),
	])
	dirty.value = false
	saveSnack.value = true
}

onMounted(() => {
	load()
})

//When we change routes this component isn't remounted. Watch for the plugin name change and load here.
watch(pluginName, load)

async function routeGuard() {
	if (!dirty.value) {
		return true
	}
	if (
		await saveDlg.value.open(
			"Unsaved Changes",
			"Do you want to save your changes?",
			"Save Changes",
			"Discard Changes"
		)
	) {
		await save()
	}
	return true
}

onBeforeRouteLeave(routeGuard)
onBeforeRouteUpdate(routeGuard)

function addRequired(schema) {
	return { ...schema, required: true }
}
</script>

<style scoped></style>
