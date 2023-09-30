<template>
	<flex-scroller ref="scroller">
		<account-widget account-type="TwitchAccount" account-id="channel" />
		<p-input-text v-model="filter" />
		<div class="px-2">
			<template v-for="pluginSettings of filteredSettings">
				<h1
					:style="{ borderBottom: `solid 2px ${pluginStore.pluginMap.get(pluginSettings.pluginId)?.color}` }"
					class="mb-5"
				>
					<i
						v-if="pluginStore.pluginMap.get(pluginSettings.pluginId)?.icon"
						:class="pluginStore.pluginMap.get(pluginSettings.pluginId)?.icon"
						:style="{ color: pluginStore.pluginMap.get(pluginSettings.pluginId)?.color }"
					/>{{ pluginStore.pluginMap.get(pluginSettings.pluginId)?.name }}
				</h1>
				<div class="px-3">
					<data-input
						v-for="settingId of pluginSettings.settings"
						:model-value="getPlugin(pluginSettings.pluginId).settings[settingId].value"
						:schema="getPlugin(pluginSettings.pluginId).settings[settingId].schema"
					/>
				</div>
			</template>
		</div>
	</flex-scroller>
</template>

<script setup lang="ts">
import { FlexScroller, AccountWidget, usePluginStore, DataInput } from "castmate-ui-core"
import { computed, ref } from "vue"
import PInputText from "primevue/inputtext"

const pluginStore = usePluginStore()

const filter = ref("")

function getPlugin(id: string) {
	const plugin = pluginStore.pluginMap.get(id)
	if (!plugin) throw new Error()
	return plugin
}

const filteredSettings = computed(() => {
	const filterValue = filter.value.toLocaleLowerCase()

	const result: { pluginId: string; settings: string[] }[] = []
	for (const [pid, plugin] of pluginStore.pluginMap) {
		const pluginSettings = {
			pluginId: pid,
			settings: new Array<string>(),
		}

		for (const sid in plugin.settings) {
			const setting = plugin.settings[sid]
			const settingNameStr = setting.schema.name?.toLocaleLowerCase() ?? sid.toLocaleLowerCase()
			if (settingNameStr.includes(filterValue)) {
				pluginSettings.settings.push(sid)
			}
		}

		if (pluginSettings.settings.length > 0) {
			result.push(pluginSettings)
		}
	}
	return result
})
</script>
