<template>
	<div class="rule-group" :class="{ and: 'and' in model, or: 'or' in model }">
		<div class="rule-group-header">
			<p-select
				v-model="groupType"
				:options="[
					{ name: 'Match All', value: 'and' },
					{ name: 'Match One', value: 'or' },
				]"
				option-label="name"
				option-value="value"
				size="small"
			/>
			<div class="flex-grow-1"></div>
			<p-button text icon="mdi mdi-close" @click="deleteMe"></p-button>
		</div>
		<div class="rule-group-content">
			<p-tree
				v-if="!hasSubCategory"
				v-model:selection-keys="treeSelectModel"
				:value="treeNodes"
				selection-mode="checkbox"
			></p-tree>
			<template v-for="(rule, i) of rules">
				<template v-if="'group' in rule" :key="rule.id">
					<twitch-viewer-custom-group-ref v-model="rules[i]" @delete="rules.splice(i, 1)" />
				</template>
			</template>

			<template v-for="(rule, i) of rules">
				<template v-if="'and' in rule || 'or' in rule" :key="rule.id">
					<twitch-viewer-group-rule-group
						v-model="rules[i] as TwitchViewerGroupAnd | TwitchViewerGroupOr"
						@delete="rules.splice(i, 1)"
					/>
				</template>
			</template>
		</div>

		<div class="rule-group-footer">
			<p-button text size="small" @click="addRef"><i class="mdi mdi-plus"></i>Group</p-button>
			<p-button text size="small" @click="addCategory"><i class="mdi mdi-plus"></i>Category</p-button>
		</div>
	</div>
</template>

<script setup lang="ts">
import { TwitchViewerGroupAnd, TwitchViewerGroupOr } from "castmate-plugin-twitch-shared"
import { computed, useModel, ref } from "vue"
import PButton from "primevue/button"
import PSelect from "primevue/dropdown"
import PCheckBox from "primevue/checkbox"
import PTriCheck from "primevue/tristatecheckbox"
import PTree from "primevue/tree"
import { TreeNode } from "primevue/tree"
import TwitchViewerCustomGroupRef from "./TwitchViewerCustomGroupRef.vue"
import { useResourceStore } from "castmate-ui-core"
import { getGroupPhrase } from "../../util/group"
const props = defineProps<{
	modelValue: TwitchViewerGroupAnd | TwitchViewerGroupOr
}>()

const model = useModel(props, "modelValue")
const emit = defineEmits(["delete"])

const treeNodes = computed<TreeNode[]>(() => {
	return [
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
				{ key: "sub-tier-1", label: "Tier 1", data: "sub-tier-1" },
				{ key: "sub-tier-2", label: "Tier 2", data: "sub-tier-2" },
				{ key: "sub-tier-3", label: "Tier 3", data: "sub-tier-3" },
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
})

function usePropertyToggle(property: string) {
	return computed({
		get(): boolean {
			const prop = rules.value.find((r) => {
				if ("property" in r) {
					if (r.property === property) return true
				}
				return false
			})

			return !!prop
		},
		set(v) {
			const idx = rules.value.findIndex((r) => {
				if ("property" in r) {
					if (r.property === property) return true
				}
				return false
			})

			if (idx < 0 && v) {
				//Not here
				rules.value.push({ property })
			} else if (!v && idx >= 0) {
				rules.value.splice(idx, 1)
			}
		},
	})
}

const following = usePropertyToggle("following")
const mod = usePropertyToggle("mod")
const vip = usePropertyToggle("vip")
const subscribed = usePropertyToggle("subscribed")
const subTier1 = usePropertyToggle("sub-tier-1")
const subTier2 = usePropertyToggle("sub-tier-2")
const subTier3 = usePropertyToggle("sub-tier-3")
const broadcaster = usePropertyToggle("broadcaster")

const hasPropertyRule = computed(
	() =>
		following.value ||
		mod.value ||
		vip.value ||
		subscribed.value ||
		subTier1.value ||
		subTier2.value ||
		subTier3.value ||
		broadcaster.value
)

interface TreeSelectionKey {
	checked: boolean
	partialChecked: boolean
}

interface PropertyKeys {
	following?: TreeSelectionKey
	vip?: TreeSelectionKey
	subscribed?: TreeSelectionKey
	["sub-tier-1"]?: TreeSelectionKey
	["sub-tier-2"]?: TreeSelectionKey
	["sub-tier-3"]?: TreeSelectionKey
	mod?: TreeSelectionKey
	broadcaster?: TreeSelectionKey
}

const treeSelectModel = computed<PropertyKeys>({
	get() {
		const result: PropertyKeys = {}

		if (following.value) {
			result.following = { checked: true, partialChecked: false }
		}

		if (vip.value) {
			result.vip = { checked: true, partialChecked: false }
		}

		let anySub = subTier1.value || subTier2.value || subTier3.value || subscribed.value
		if (anySub) {
			result.subscribed = {
				checked: subscribed.value,
				partialChecked: subTier1.value || subTier2.value || subTier3.value,
			}
		}

		if (subTier1.value) {
			result["sub-tier-1"] = { checked: subTier1.value, partialChecked: false }
		}

		if (subTier2.value) {
			result["sub-tier-2"] = { checked: subTier2.value, partialChecked: false }
		}

		if (subTier3.value) {
			result["sub-tier-3"] = { checked: subTier3.value, partialChecked: false }
		}

		if (subscribed.value) {
			result["sub-tier-1"] = { checked: true, partialChecked: false }
			result["sub-tier-2"] = { checked: true, partialChecked: false }
			result["sub-tier-3"] = { checked: true, partialChecked: false }
		}

		if (mod.value) {
			result.mod = { checked: true, partialChecked: false }
		}

		if (broadcaster.value) {
			result.broadcaster = { checked: true, partialChecked: false }
		}

		return result
	},
	set(v) {
		following.value = v.following != null
		vip.value = v.vip != null

		subscribed.value = v.subscribed?.checked || false

		subTier1.value = v["sub-tier-1"] != null && !v.subscribed?.checked
		subTier2.value = v["sub-tier-2"] != null && !v.subscribed?.checked
		subTier3.value = v["sub-tier-3"] != null && !v.subscribed?.checked

		mod.value = v.mod != null
		broadcaster.value = v.broadcaster != null
	},
})

function deleteMe(ev: MouseEvent) {
	ev.preventDefault()
	ev.stopPropagation()
	emit("delete")
}

const groupType = computed({
	get() {
		if ("and" in model.value) {
			return "and"
		} else {
			return "or"
		}
	},
	set(v) {
		if (v in model.value) return

		if (v == "and" && "or" in model.value) {
			model.value = { and: model.value.or }
		} else if (v == "or" && "and" in model.value) {
			model.value = { or: model.value.and }
		}
	},
})

const rules = computed({
	get() {
		if ("and" in model.value) {
			return model.value.and
		} else {
			return model.value.or
		}
	},
	set(v) {
		if ("and" in model.value) {
			model.value.and = v
		} else {
			model.value.or = v
		}
	},
})

function addRef(ev: MouseEvent) {
	ev.preventDefault()
	ev.stopPropagation()
	rules.value.push({
		group: null,
	})
}

const hasSubCategory = computed(() => {
	return rules.value.find((r) => "and" in r || "or" in r) != null
})

function addCategory(ev: MouseEvent) {
	ev.preventDefault()
	ev.stopPropagation()
	const newCategory: TwitchViewerGroupOr = {
		or: [],
	}

	if (!hasSubCategory.value) {
		//Usually by adding another category the user wants to logically and them together

		if (hasPropertyRule.value) {
			//Move all our property values to a sub category
			//@ts-ignore Once again, compiler bug unable to resolve this is indeed 'and' | 'or'
			const impliedSubCat: TwitchViewerGroupAnd | TwitchViewerGroupOr = {
				[groupType.value]: rules.value.filter((r) => "property" in r),
			}

			rules.value = [...rules.value.filter((r) => !("property" in r)), impliedSubCat, newCategory]
		} else {
			rules.value.push(newCategory)
		}
		groupType.value = "and"
	} else {
		rules.value.push(newCategory)
	}
}
</script>

<style scoped>
.rule-group {
	border-radius: var(--border-radius);

	border: solid 1px white;
}

.rule-group-content {
	padding: 0.25rem;
}

.rule-group-header {
	border-top-left-radius: var(--border-radius);
	border-top-right-radius: var(--border-radius);
	background-color: white;
	padding: 0.25rem;
	display: flex;
	flex-direction: row;
}

.and {
	border-color: green;
}
.and .rule-group-header {
	background-color: green;
}

.or {
	border-color: blue;
}

.or .rule-group-header {
	background-color: blue;
}

.prop-select {
	margin-bottom: 0.5rem;
}

.rule-group :deep(.p-tree) {
	padding: 0.2rem;
	border: none;
}

.rule-group :deep(.p-tree .p-tree-container .p-treenode) {
	padding: 0;
}

.rule-group :deep(.p-tree .p-tree-container .p-treenode) {
	margin-bottom: 0.2rem;
}
.rule-group :deep(.p-tree .p-tree-container .p-treenode:first-child) {
	margin-top: 0.2rem;
}

.rule-group :deep(.p-tree .p-treenode .p-treenode-content) {
	padding: 0.2rem;
}

.rule-group :deep(.p-tree .p-treenode .p-treenode-content .p-tree-toggler) {
	height: 1rem;
	border: 0;
	border-radius: var(--border-radius);
	box-shadow: none;
}
</style>
