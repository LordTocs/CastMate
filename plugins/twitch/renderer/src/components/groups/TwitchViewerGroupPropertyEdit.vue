<template>
	<div class="group-property-edit p-1 flex flex-row">
		<div class="flex-grow-1 flex-shrink-0">
			<p-tree v-model:selection-keys="treeSelectModel" :value="treeNodes" selection-mode="checkbox"></p-tree>
		</div>
		<div class="flex flex-column">
			<p-button text size="small" icon="mdi mdi-delete" @click="emit('delete')"></p-button>
			<div class="flex-grow-1" />
			<p-button
				text
				size="small"
				:icon="excluded ? 'mdi mdi-equal' : 'mdi mdi-not-equal-variant'"
				@click="excluded = !excluded"
			></p-button>
		</div>
	</div>
</template>

<script setup lang="ts">
import { SchemaTwitchViewerGroup, TwitchViewerGroupProperties } from "castmate-plugin-twitch-shared"

import PTree from "primevue/tree"
import PButton from "primevue/button"
import { TreeNode } from "primevue/treenode"
import { computed, useModel } from "vue"

const props = defineProps<{
	modelValue: TwitchViewerGroupProperties
	excluded: boolean
	schema: SchemaTwitchViewerGroup
}>()

const model = useModel(props, "modelValue")
const excluded = useModel(props, "excluded")

const emit = defineEmits(["delete"])

interface TreeSelectionKey {
	checked: boolean
	partialChecked: boolean
}

interface PropertyKeys {
	anonymous?: TreeSelectionKey
	following?: TreeSelectionKey
	vip?: TreeSelectionKey
	subscribed?: TreeSelectionKey
	subTier1?: TreeSelectionKey
	subTier2?: TreeSelectionKey
	subTier3?: TreeSelectionKey
	mod?: TreeSelectionKey
	broadcaster?: TreeSelectionKey
}

const treeSelectModel = computed<PropertyKeys>({
	get() {
		const result: PropertyKeys = {}

		if (model.value.properties.following) {
			result.following = { checked: true, partialChecked: false }
		}

		if (model.value.properties.vip) {
			result.vip = { checked: true, partialChecked: false }
		}

		if (props.schema.anonymous) {
			if (model.value.properties.anonymous) {
				result.anonymous = { checked: true, partialChecked: false }
			}
		}

		const anySub = !!(
			model.value.properties.subTier1 ||
			model.value.properties.subTier2 ||
			model.value.properties.subTier3
		)
		const allSub = !!(
			model.value.properties.subTier1 &&
			model.value.properties.subTier2 &&
			model.value.properties.subTier3
		)
		if (anySub) {
			result.subscribed = {
				checked: allSub,
				partialChecked: anySub && !allSub,
			}
		}

		if (model.value.properties.subTier1) {
			result.subTier1 = { checked: model.value.properties.subTier1, partialChecked: false }
		}

		if (model.value.properties.subTier2) {
			result.subTier2 = { checked: model.value.properties.subTier2, partialChecked: false }
		}

		if (model.value.properties.subTier3) {
			result.subTier3 = { checked: model.value.properties.subTier3, partialChecked: false }
		}

		if (model.value.properties.mod) {
			result.mod = { checked: true, partialChecked: false }
		}

		if (model.value.properties.broadcaster) {
			result.broadcaster = { checked: true, partialChecked: false }
		}

		return result
	},
	set(v) {
		const result: TwitchViewerGroupProperties = { properties: {} }

		if (v.following) {
			result.properties.following = true
		}

		if (v.vip) {
			result.properties.vip = true
		}

		if (props.schema.anonymous && v.anonymous) {
			result.properties.anonymous = true
		}

		if (v.subTier1) {
			result.properties.subTier1 = true
		}

		if (v.subTier2) {
			result.properties.subTier2 = true
		}

		if (v.subTier3) {
			result.properties.subTier3 = true
		}

		if (v.mod) {
			result.properties.mod = true
		}

		if (v.broadcaster) {
			result.properties.broadcaster = true
		}

		model.value = result
	},
})

const treeNodes = computed<TreeNode[]>(() => {
	const result: TreeNode[] = [
		{
			key: "following",
			label: "Followers",
			data: "following",
		},
		{
			key: "vip",
			label: "VIPs",
			data: "vip",
		},
		{
			key: "subscribed",
			label: "Subscribers",
			data: "subscribed",
			children: [
				{ key: "subTier1", label: "Tier 1", data: "subTier1" },
				{ key: "subTier2", label: "Tier 2", data: "subTier2" },
				{ key: "subTier3", label: "Tier 3", data: "subTier3" },
			],
		},
		{
			key: "mod",
			label: "Mods",
			data: "mod",
		},
		{
			key: "broadcaster",
			label: "Broadcaster",
			data: "broadcaster",
		},
	]

	if (props.schema.anonymous) {
		result.unshift({
			key: "anonymous",
			label: "Anonymous",
			data: "anonymous",
		})
	}

	return result
})
</script>

<style scoped>
.excluded > * > .group-property-edit {
	border-color: red;
	border-top-left-radius: 0;
	border-bottom-left-radius: 0;
}

.group-property-edit {
	border-radius: var(--border-radius);
	border: solid 1px var(--surface-d);
}

.group-property-edit :deep(.p-tree) {
	padding: 0.2rem;
	border: none;
}

.group-property-edit :deep(.p-tree .p-tree-container .p-treenode) {
	padding: 0;
}

.group-property-edit :deep(.p-tree .p-tree-container .p-treenode) {
	margin-bottom: 0.2rem;
}
.group-property-edit :deep(.p-tree .p-tree-container .p-treenode:first-child) {
	margin-top: 0.2rem;
}

.group-property-edit :deep(.p-tree .p-treenode .p-treenode-content) {
	padding: 0.2rem;
}

.group-property-edit :deep(.p-tree .p-treenode .p-treenode-content .p-tree-toggler) {
	height: 1rem;
	border: 0;
	border-radius: var(--border-radius);
	box-shadow: none;
}
</style>
