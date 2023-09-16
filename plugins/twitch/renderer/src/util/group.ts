import { TwitchViewerGroup } from "castmate-plugin-twitch-shared"
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
		if ("property" in rule) {
			switch (rule.property) {
				case "following":
					words.push("Followers")
					break
				case "subscribed":
					words.push("Subscribers")
					break
				case "sub-tier-1":
					words.push("Tier 1 Subs")
					break
				case "sub-tier-2":
					words.push("Tier 2 Subs")
					break
				case "sub-tier-3":
					words.push("Tier 3 Subs")
					break
				case "mod":
					words.push("Mods")
					break
				case "vip":
					words.push("VIPs")
					break
				case "broadcaster":
					words.push("Broadcaster")
					break
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
