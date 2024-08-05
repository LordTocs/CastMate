import {
	FileResource,
	Resource,
	ResourceRegistry,
	ResourceStorage,
	defineAction,
	definePluginResource,
	onLoad,
	usePluginLogger,
} from "castmate-core"
import {
	TwitchViewerGroupConfig,
	TwitchViewerGroup,
	TwitchViewerGroupRule,
	TwitchViewer,
} from "castmate-plugin-twitch-shared"
import { nanoid } from "nanoid/non-secure"
import { ViewerCache } from "./viewer-cache"
import { TwitchAccount } from "./twitch-auth"

const logger = usePluginLogger("twitch")

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
		for (const userId of savedConfig.userIds) {
			//Mark users as relevant so their data will be cached by batch operations
			ViewerCache.getInstance().markRelevant(userId)
		}
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

	async clear() {
		this.config.userIds = new Set()
		await this.save()
		await this.updateUI()
	}

	static async initialize() {
		await super.initialize()

		//@ts-ignore
		ResourceRegistry.getInstance().exposeIPCFunction(CustomTwitchViewerGroup, "add")
		//@ts-ignore
		ResourceRegistry.getInstance().exposeIPCFunction(CustomTwitchViewerGroup, "remove")
	}
}

export function setupViewerGroups() {
	definePluginResource(CustomTwitchViewerGroup)

	defineAction({
		id: "addViewerToGroup",
		name: "Add Viewer to Group",
		icon: "mdi mdi-account-group",
		config: {
			type: Object,
			properties: {
				group: { type: CustomTwitchViewerGroup, name: "Group", required: true },
				viewer: { type: TwitchViewer, name: "Viewer", required: true, template: true },
			},
		},
		async invoke(config, contextData, abortSignal) {
			await config.group.add(config.viewer)
		},
	})

	defineAction({
		id: "removeViewerFromGroup",
		name: "Remove Viewer from Group",
		icon: "mdi mdi-account-group",
		config: {
			type: Object,
			properties: {
				group: { type: CustomTwitchViewerGroup, name: "Group", required: true },
				viewer: { type: TwitchViewer, name: "Viewer", required: true, template: true },
			},
		},
		async invoke(config, contextData, abortSignal) {
			await config.group.remove(config.viewer)
		},
	})

	defineAction({
		id: "clearViewerGroup",
		name: "Clear Viewer Group",
		description: "Becareful you can't undo this!!",
		icon: "mdi mdi-account-group",
		config: {
			type: Object,
			properties: {
				group: { type: CustomTwitchViewerGroup, name: "Group", required: true },
			},
		},
		async invoke(config, contextData, abortSignal) {
			await config.group.clear()
		},
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
	} else if ("properties" in rule) {
		//Todo: Make this not silly hardcoded
		if (rule.properties.anonymous && userId == "anonymous") return true

		if (userId == "anonymous") return false

		if (rule.properties.following) {
			if (await ViewerCache.getInstance().getIsFollowing(userId)) return true
		}

		if (rule.properties.subTier1) {
			if ((await ViewerCache.getInstance().getSubInfo(userId))?.tier == 1) return true
		}
		if (rule.properties.subTier2) {
			if ((await ViewerCache.getInstance().getSubInfo(userId))?.tier == 2) return true
		}
		if (rule.properties.subTier3) {
			if ((await ViewerCache.getInstance().getSubInfo(userId))?.tier == 3) return true
		}
		if (rule.properties.mod) {
			if (await ViewerCache.getInstance().getIsMod(userId)) return true
		}
		if (rule.properties.vip) {
			if (await ViewerCache.getInstance().getIsVIP(userId)) return true
		}
		if (rule.properties.broadcaster) {
			if (userId === TwitchAccount.channel.twitchId) return true
		}
		return false
	} else if ("group" in rule) {
		if (!rule.group) return false
		const group = CustomTwitchViewerGroup.storage.getById(rule.group)
		if (!group) return false
		return group.contains(userId)
	} else if ("userIds" in rule) {
		return rule.userIds.includes(userId)
	}
	logger.log("Unknown Group Rule", rule)
	return false
}

export async function isEmptyTwitchViewerGroup(group: TwitchViewerGroup) {
	return !group?.rule
}

export async function inTwitchViewerGroup(userId: string, group: TwitchViewerGroup) {
	if (!group?.rule) return true //Empty is everyone

	return await satisfiesRule(userId, group.rule)
}
