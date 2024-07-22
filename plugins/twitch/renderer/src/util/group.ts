import {
	TwitchViewerGroup,
	TwitchViewerUnresolved,
	isGroupResourceRef,
	isInlineViewerGroup,
	isViewerGroupPropertyRule,
} from "castmate-plugin-twitch-shared"
import { useResourceStore } from "castmate-ui-core"
//TODO: Uhhhh i18n??

export function getGroupPhrase(group: TwitchViewerGroup, resourceStore: ReturnType<typeof useResourceStore>) {
	if (!group?.rule) return "Everyone"

	const rules = "and" in group.rule ? group.rule.and : group.rule.or

	if (rules.length == 0) return "No One"

	const subcat = rules.find((r) => "and" in r || "or" in r)

	if (subcat != null || "and" in group.rule) {
		return "Custom"
	}

	const words: String[] = []

	for (const rule of rules) {
		if (isViewerGroupPropertyRule(rule)) {
			if (rule.properties.following) {
				words.push("Followers")
			}

			if (rule.properties.anonymous) {
				words.push("Anonymous")
			}

			const subTier1 = rule.properties.subTier1
			const subTier2 = rule.properties.subTier1
			const subTier3 = rule.properties.subTier1

			const allSub = subTier1 && subTier2 && subTier3

			if (allSub) {
				words.push("Subscribers")
			} else {
				if (subTier1) {
					words.push("Tier 1 Subs")
				}
				if (subTier2) {
					words.push("Tier 2 Subs")
				}
				if (subTier3) {
					words.push("Tier 3 Subs")
				}
			}

			if (rule.properties.mod) {
				words.push("Mods")
			}

			if (rule.properties.vip) {
				words.push("VIPs")
			}

			if (rule.properties.broadcaster) {
				words.push("Broadcaster")
			}
		}
	}

	for (const rule of rules) {
		if ("group" in rule) {
			if (rule.group) {
				const customGroup = resourceStore.resourceMap.get("CustomTwitchViewerGroup")?.resources?.get(rule.group)
				if (customGroup) {
					words.push(`in ${customGroup.config.name}`)
				}
			}
		}
	}

	if (words.length == 0) {
		return "Custom"
	}

	let result = ""

	for (let i = 0; i < words.length; ++i) {
		if (i > 0 && words.length > 2) {
			result += ","
		}

		if (i > 0) {
			result += " "
		}

		if (words.length > 1 && words.length > 1 && i == words.length - 1) {
			result += "and "
		}

		result += words[i]
	}

	return result
}

export interface GroupSpanGroupResource {
	type: "resource"
	id: string
}

export function isGroupSpanGroupResource(item: GroupSpanItem): item is GroupSpanGroupResource {
	if (!item) return false
	if (typeof item == "string") return false
	if (item.type == "resource") return true
	return false
}

export interface GroupSpanViewer {
	type: "viewer"
	viewer: TwitchViewerUnresolved
}

export function isGroupSpanViewer(item: GroupSpanItem): item is GroupSpanViewer {
	if (!item) return false
	if (typeof item == "string") return false
	if (item.type == "viewer") return true
	return false
}
export type GroupSpanItem = string | GroupSpanGroupResource | GroupSpanViewer

export function getGroupSpanItems(group: TwitchViewerGroup | undefined): GroupSpanItem[] {
	if (!group?.rule) return ["Everyone"]

	const rules = "and" in group.rule ? group.rule.and : group.rule.or

	if (rules.length == 0) return ["No One"]

	const subcat = rules.find((r) => "and" in r || "or" in r)

	if (subcat != null || "and" in group.rule) {
		return ["Custom"]
	}

	const words: GroupSpanItem[] = []

	for (const rule of rules) {
		if (isViewerGroupPropertyRule(rule)) {
			if (rule.properties.following) {
				words.push("Followers")
			}

			if (rule.properties.anonymous) {
				words.push("Anonymous")
			}

			const subTier1 = rule.properties.subTier1
			const subTier2 = rule.properties.subTier2
			const subTier3 = rule.properties.subTier3

			const allSub = subTier1 && subTier2 && subTier3

			if (allSub) {
				words.push("Subscribers")
			} else {
				if (subTier1) {
					words.push("Tier 1 Subs")
				}
				if (subTier2) {
					words.push("Tier 2 Subs")
				}
				if (subTier3) {
					words.push("Tier 3 Subs")
				}
			}

			if (rule.properties.mod) {
				words.push("Mods")
			}

			if (rule.properties.vip) {
				words.push("VIPs")
			}

			if (rule.properties.broadcaster) {
				words.push("Broadcaster")
			}
		}
	}

	for (const rule of rules) {
		if (isGroupResourceRef(rule)) {
			if (rule.group) {
				words.push({
					type: "resource",
					id: rule.group,
				})
			}
		}
	}

	for (const rule of rules) {
		if (isInlineViewerGroup(rule)) {
			for (const viewer of rule.userIds) {
				words.push({
					type: "viewer",
					viewer,
				})
			}
		}
	}

	if (words.length == 0) {
		return ["Custom"]
	}

	return words
}
