import { FileResource, Resource, ResourceRegistry, ResourceStorage, onLoad } from "castmate-core"
import { TwitchViewerGroupConfig, TwitchViewerGroup, TwitchViewerGroupRule } from "castmate-plugin-twitch-shared"
import { nanoid } from "nanoid"
import { ViewerCache } from "./viewer-cache"
import { TwitchAccount } from "./twitch-auth"

interface SerializedConfig {
	name: string
	userIds: string[]
}

export class CustomTwitchViewerGroup extends FileResource<TwitchViewerGroupConfig> {
	static resourceDirectory = "./twitch/groups"
	static storage = new ResourceStorage<CustomTwitchViewerGroup>("CustomTwitchViewerGroup")

	constructor(name?: string) {
		super()

		if (name) {
			this._id = nanoid()
			this._config = {
				name,
				userIds: new Set<string>(),
			}
		}
	}

	get savedConfig(): SerializedConfig {
		return {
			name: this.config.name,
			userIds: [...this.config.userIds],
		}
	}

	async load(savedConfig: SerializedConfig): Promise<boolean> {
		await super.setConfig({
			name: savedConfig.name,
			userIds: new Set<string>(savedConfig.userIds),
		})
		return true
	}

	contains(userId: string): boolean {
		return this.config.userIds.has(userId)
	}

	async add(userId: string) {
		this.config.userIds.add(userId)
		await this.save()
		await this.updateUI()
	}

	async remove(userId: string) {
		this.config.userIds.delete(userId)
		await this.save()
		await this.updateUI()
	}
}

export function setupViewerGroups() {
	onLoad(() => {
		ResourceRegistry.getInstance().register(CustomTwitchViewerGroup)
	})
}

async function satisfiesRule(userId: string, rule: TwitchViewerGroupRule): Promise<boolean> {
	if ("exclude" in rule) {
		return !(await satisfiesRule(userId, rule.exclude))
	} else if ("and" in rule) {
		for (const subrule of rule.and) {
			if (!(await satisfiesRule(userId, subrule))) {
				return false
			}
		}
		return true
	} else if ("or" in rule) {
		for (const subrule of rule.or) {
			if (await satisfiesRule(userId, subrule)) {
				return true
			}
		}
		return false
	} else if ("property" in rule) {
		//Todo: Make this not silly hardcoded
		if (rule.property === "following") {
			return await ViewerCache.getInstance().getIsFollowing(userId)
		} else if (rule.property === "subscribed") {
			return await ViewerCache.getInstance().getIsSubbed(userId)
		} else if (rule.property === "sub-tier-1") {
			return (await ViewerCache.getInstance().getSubInfo(userId))?.tier == 1
		} else if (rule.property === "sub-tier-2") {
			return (await ViewerCache.getInstance().getSubInfo(userId))?.tier == 2
		} else if (rule.property === "sub-tier-3") {
			return (await ViewerCache.getInstance().getSubInfo(userId))?.tier == 3
		} else if (rule.property === "mod") {
			return await ViewerCache.getInstance().getIsMod(userId)
		} else if (rule.property === "vip") {
			return await ViewerCache.getInstance().getIsVIP(userId)
		} else if (rule.property === "broadcaster") {
			return userId === TwitchAccount.channel.twitchId
		}
		return false
	} else if ("group" in rule) {
		if (!rule.group) return false
		const group = CustomTwitchViewerGroup.storage.getById(rule.group)
		if (!group) return false
		return group.contains(userId)
	}
	return false
}

export async function inTwitchViewerGroup(userId: string, group: TwitchViewerGroup) {
	if (!group?.rule) return true //Empty is everyone

	return await satisfiesRule(userId, group.rule)
}
