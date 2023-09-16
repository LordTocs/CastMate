import { SchemaBase, registerType } from "castmate-schema"

export interface TwitchViewerGroupProperty {
	property: string
}

export interface CustomTwitchViewerGroupRef {
	group: string | null
}

export interface TwitchViewerGroupExclusion {
	exclude: Exclude<TwitchViewerGroupRule, TwitchViewerGroupExclusion>
}

export type TwitchViewerGroupBaseRule = TwitchViewerGroupProperty | CustomTwitchViewerGroupRef

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

export interface SchemaTwitchViewerGroup extends SchemaBase {
	type: TwitchViewerGroupFactory
}

declare module "castmate-schema" {
	interface SchemaTypeMap {
		SourceTransform: [SchemaTwitchViewerGroup, TwitchViewerGroup]
	}
}

registerType("TwitchViewerGroup", {
	constructor: TwitchViewerGroup,
})

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
