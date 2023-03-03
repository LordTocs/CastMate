<template>
	<v-list color="grey darken-4" class="action-list" dense>
		<v-list-group
			v-for="plugin in actionPlugins"
			:key="plugin.name"
			no-action
		>
			<template #activator="{ props }">
				<v-list-item
					v-bind="props"
					:prepend-icon="plugin.icon"
					:title="plugin.uiName"
				/>
			</template>

			<draggable
				:model-value="pluginActionLists[plugin.name]"
				:item-key="getDraggableId"
				:group="{ name: 'actions', pull: 'clone', put: false }"
				:sort="false"
				:clone="cloneAction"
			>
				<template #item="{ element, index }">
					<action-toolbox-item :plugin-action="element" />
				</template>
			</draggable>
		</v-list-group>
	</v-list>
</template>

<script>
import Draggable from "vuedraggable"
import { constructDefaultSchema } from "../../utils/objects"
import { nanoid } from "nanoid/non-secure"
import _cloneDeep from "lodash/cloneDeep"
import ActionToolboxItem from "./ActionToolboxItem.vue"
import { mapState } from "pinia"
import { usePluginStore } from "../../store/plugins"

export default {
	components: { Draggable, ActionToolboxItem },
	computed: {
		...mapState(usePluginStore, {
			pluginList: "pluginList",
		}),
		actionPlugins() {
			return this.pluginList.filter(
				(plugin) => Object.keys(plugin.actions).length > 0
			)
		},
		pluginActionLists() {
			const pluginLists = {}

			for (let plugin of this.actionPlugins) {
				pluginLists[plugin.name] = Object.keys(plugin.actions).map(
					(actionKey) => ({
						plugin: plugin.name,
						action: actionKey,
						data: constructDefaultSchema(
							plugin.actions[actionKey].data
						),
					})
				)
			}

			return pluginLists
		},
	},
	methods: {
		getDraggableId(item) {
			return `${item.plugin}.${item.action}`
		},
		cloneAction(original) {
			console.log("CLONING")
			const copy = _cloneDeep(original)
			copy.id = nanoid()
			return copy
		},
	},
}
</script>

<style>
.action-list .v-list-group--no-action > .v-list-group__items > .v-list-item {
	padding-left: 16px;
}
</style>
