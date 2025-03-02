<template>
	<div class="flex flex-column flex-grow-1">
		<div class="flex flex-row justify-content-center gap-3 my-1 mx-3">
			<div class="flex-grow-1"></div>
			<p-button outlined size="large" @click="cancel">Cancel</p-button>
			<p-button size="large" @click="done">Done</p-button>
		</div>
		<flex-scroller class="flex-grow-1">
			<div class="p-3">
				<span class="p-input-icon-left">
					<i class="pi pi-search" />
					<p-input-text v-model="filter" placeholder="search" />
				</span>
			</div>
			<div class="px-2">
				<template v-for="pluginSettings of filteredSettings" :key="pluginSettings.pluginId">
					<h1
						:style="{
							borderBottom: `solid 2px ${pluginStore.pluginMap.get(pluginSettings.pluginId)?.color}`,
						}"
						class="mb-2 mt-1"
					>
						<i
							v-if="pluginStore.pluginMap.get(pluginSettings.pluginId)?.icon"
							class="mr-3"
							:class="pluginStore.pluginMap.get(pluginSettings.pluginId)?.icon"
							:style="{ color: pluginStore.pluginMap.get(pluginSettings.pluginId)?.color }"
						/>{{ pluginStore.pluginMap.get(pluginSettings.pluginId)?.name }}
					</h1>
					<div class="px-3">
						<template v-for="[sid, setting] in Object.entries(pluginSettings.settings)" :key="sid">
							<div v-if="setting.type == 'value' || setting.type == 'secret'" class="mt-5">
								<data-input
									:schema="setting.schema"
									:secret="setting.type == 'secret'"
									v-model="settings[pluginSettings.pluginId][sid]"
									:local-path="`settings.${pluginSettings.pluginId}.${sid}`"
								/>
							</div>
							<div v-else-if="setting.type == 'resource'">
								{{ setting.name }}
								<component
									:is="resourceStore.resourceMap.get(setting.resourceId)?.settingComponent"
									:resource-type="setting.resourceId"
								/>
							</div>
							<div v-else-if="setting.type == 'component'">
								<component v-if="setting.component" :is="setting.component" />
							</div>
						</template>
					</div>
				</template>
			</div>
		</flex-scroller>
	</div>
</template>

<script setup lang="ts">
import PButton from "primevue/button"
import {
	FlexScroller,
	SettingDefinition,
	usePluginStore,
	useResourceStore,
	useSettingWatcher,
	DataInput,
	usePrimarySatelliteConnection,
	SettingsChange,
} from "castmate-ui-core"
import { computed, onBeforeMount, onMounted, ref } from "vue"
import _cloneDeep from "lodash/cloneDeep"

import PInputText from "primevue/inputtext"
import { usePageStore } from "../../util/page-store"

const filter = ref<string>("")

const pluginStore = usePluginStore()
const resourceStore = useResourceStore()

interface SettingsObject {
	[plugin: string]: {
		[setting: string]: any
	}
}

const settings = ref<SettingsObject>({})

onBeforeMount(() => {
	for (const plugin of pluginStore.pluginMap.values()) {
		settings.value[plugin.id] = {}

		for (const settingId in plugin.settings) {
			console.log(plugin.id, settingId)
			const setting = plugin.settings[settingId]
			if (setting.type == "value" || setting.type == "secret") {
				settings.value[plugin.id][settingId] = _cloneDeep(setting.value)
			}
		}
	}

	console.log("Settings", settings.value)
})

useSettingWatcher((plugin, setting, value) => {
	if (!settings.value[plugin]) return
	settings.value[plugin][setting] = value
})

const filteredSettings = computed(() => {
	const filterValue = filter.value.toLocaleLowerCase()

	const result: { pluginId: string; settings: Record<string, SettingDefinition> }[] = []
	for (const [pid, plugin] of pluginStore.pluginMap) {
		const pluginSettings = {
			pluginId: pid,
			settings: {} as Record<string, SettingDefinition>,
		}

		for (const sid in plugin.settings) {
			const setting = plugin.settings[sid]
			if (setting.type == "value" || setting.type == "secret") {
				const settingNameStr = setting.schema.name?.toLocaleLowerCase() ?? sid.toLocaleLowerCase()
				if (settingNameStr.includes(filterValue)) {
					pluginSettings.settings[sid] = setting
				}
			} else if (setting.type == "resource") {
				const settingNameStr = setting.name.toLocaleLowerCase()
				if (settingNameStr.includes(filterValue)) {
					pluginSettings.settings[sid] = setting
				}
			} else if (setting.type == "component") {
				const componentId = sid
				if (componentId.includes(filterValue)) {
					pluginSettings.settings[componentId] = setting
				}
			}
		}

		if (Object.keys(pluginSettings.settings).length > 0) {
			result.push(pluginSettings)
		}
	}
	return result
})

const pageStore = usePageStore()
const connection = usePrimarySatelliteConnection()

async function done() {
	const changes: SettingsChange[] = []

	for (const plugin of pluginStore.pluginMap.values()) {
		for (const settingId in plugin.settings) {
			const setting = plugin.settings[settingId]
			if (setting.type != "value" && setting.type != "secret") continue
			const newValue = settings.value[plugin.id][settingId]
			const oldValue = setting.value
			if (newValue != oldValue) {
				changes.push({
					pluginId: plugin.id,
					settingId,
					value: newValue,
				})
			}
		}
	}

	await pluginStore.updateSettings(changes)

	goBack()
}

function cancel() {
	goBack()
}

function goBack() {
	if (connection.value?.state == "connected") {
		pageStore.page = "dashboard"
	} else if (connection.value?.state == "connecting") {
		pageStore.page = "connecting"
	} else if (connection.value?.state == "disconnected") {
		pageStore.page = "connectionSelection"
	} else {
		pageStore.page = "connectionSelection"
	}
}
</script>
