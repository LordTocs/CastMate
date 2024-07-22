import { SchemaBase, registerType } from "castmate-schema"

export interface TwitchViewerGroupConfig {
	name: string
	userIds: Set<string>
}

export interface TwitchViewerGroupProperties {
	properties: {
		anonymous?: boolean
		following?: boolean
		vip?: boolean
		subTier1?: boolean
		subTier2?: boolean
		subTier3?: boolean
		mod?: boolean
		broadcaster?: boolean
	}
}

export interface TwitchViewerGroupResourceRef {
	group: string | null
}

export interface TwitchViewerGroupInlineList {
	userIds: string[]
}

export interface TwitchViewerGroupExclusion {
	exclude: Exclude<TwitchViewerGroupRule, TwitchViewerGroupExclusion>
}

export type TwitchViewerGroupBaseRule =
	| TwitchViewerGroupProperties
	| TwitchViewerGroupResourceRef
	| TwitchViewerGroupInlineList

export type TwitchViewerGroupRule =
	| TwitchViewerGroupAnd
	| TwitchViewerGroupOr
	| TwitchViewerGroupExclusion
	| TwitchViewerGroupBaseRule

export interface TwitchViewerGroupAnd {
	and: TwitchViewerGroupRule[]
}
export interface TwitchViewerGroupOr {
	or: TwitchViewerGroupRule[]
}

export interface TwitchViewerGroup {
	rule?: TwitchViewerGroupOr | TwitchViewerGroupAnd
}

type TwitchViewerGroupFactory = { factoryCreate(): TwitchViewerGroup }
export const TwitchViewerGroup: TwitchViewerGroupFactory = {
	factoryCreate() {
		return {}
	},
}

export interface SchemaTwitchViewerGroup extends SchemaBase<TwitchViewerGroup> {
	type: TwitchViewerGroupFactory
	anonymous?: boolean
}

declare module "castmate-schema" {
	interface SchemaTypeMap {
		TwitchViewerGroup: [SchemaTwitchViewerGroup, TwitchViewerGroup]
	}
}

registerType("TwitchViewerGroup", {
	constructor: TwitchViewerGroup,
})

export function isInlineViewerGroup(rule: TwitchViewerGroupRule | undefined): rule is TwitchViewerGroupInlineList {
	if (!rule) return false
	return "userIds" in rule
}

export function isGroupResourceRef(rule: TwitchViewerGroupRule | undefined): rule is TwitchViewerGroupResourceRef {
	if (!rule) return false
	return "group" in rule
}

export function isExclusionRule(rule: TwitchViewerGroupRule | undefined): rule is TwitchViewerGroupExclusion {
	if (!rule) return false
	return "exclude" in rule
}

export function isLogicGroup(
	rule: TwitchViewerGroupRule | undefined
): rule is TwitchViewerGroupOr | TwitchViewerGroupAnd {
	if (!rule) return false
	return "and" in rule || "or" in rule
}

export function isViewerGroupPropertyRule(
	rule: TwitchViewerGroupRule | undefined
): rule is TwitchViewerGroupProperties {
	if (!rule) return false
	return "properties" in rule
}
// Everyone
// []

// Followers Only
// [{ property: "following" }]

// Everyone except Followers
//[{ exclude: { property: "following" } }]

// Subs
//[{ property: "subscribed" }]

// Everyone except Subs
// [{ exclude: { property: "subscribed" }}]

// Tier 1 Subs
// [{ property: "sub-tier-1"}]

// Everyone except Tier 1 Subs
// [{ exclude: { subs: [1] }}]
//[{ exclude: [{ subs}, { follows}]}, {vips}]

// Tier 1 and Tier 2 Subs
//[{ subs: [1,2] }]

//[{ property: "subscribed"}, { property: "vip"}]
//

// Everyone except Tier 1 or Tier 2 subs

// Everyone except this custom group

// Everyone except this custom group, but including this custom group
// [{exclude: { group: id}}, { group: id}]

////

// { or: [..., ...]}
// { and: [..., ...]}

// { or: [ { property: "following"}, { property: "subscribed"}]}

// { and: [ { property: "subscribed"}, { property: "vip"}]}

// { or: [ { and: [ { property: "following" }, { property: "vip"}] }, { property: "subscribed"} }]}
