<template>
	<flex-scroller ref="scroller" v-model:scroll-x="view.scrollX" v-model:scroll-y="view.scrollY">
		<div class="p-3">
			<span class="p-input-icon-left">
				<i class="pi pi-search" />
				<p-input-text v-model="view.filter" placeholder="search" />
			</span>
		</div>
		<div class="px-2">
			<template v-for="pluginSettings of filteredSettings" :key="pluginSettings.pluginId">
				<h1
					:style="{ borderBottom: `solid 2px ${pluginStore.pluginMap.get(pluginSettings.pluginId)?.color}` }"
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
								v-model="model.settings[pluginSettings.pluginId][sid]"
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
</template>

<script setup lang="ts">
import {
	FlexScroller,
	AccountWidget,
	usePluginStore,
	DataInput,
	useResourceStore,
	SettingDefinition,
	useSettingWatcher,
	useDocumentId,
	useDocument,
} from "castmate-ui-core"
import { computed, ref, useModel, watch } from "vue"
import { SettingsDocumentData, SettingsViewData } from "./SettingsTypes"
import PInputText from "primevue/inputtext"

const props = defineProps<{
	modelValue: SettingsDocumentData
	view: SettingsViewData
}>()

const model = useModel(props, "modelValue")
const view = useModel(props, "view")

const pluginStore = usePluginStore()
const resourceStore = useResourceStore()

const documentId = useDocumentId()

const document = useDocument(() => documentId.value)

useSettingWatcher((plugin, setting, value) => {
	if (!document.value) return
	if (!document.value.data.settings) return
	if (!document.value.data.settings[plugin]) return
	document.value.data.settings[plugin][setting] = value
})

const filteredSettings = computed(() => {
	const filterValue = view.value.filter.toLocaleLowerCase()

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
</script>
