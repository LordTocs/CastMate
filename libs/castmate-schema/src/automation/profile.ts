import { CastMateBuiltInPlugin } from "../plugins/builtin-plugin"
import { defineResource, Resource } from "../plugins/resources"
import { S } from "../schema/schema-base"

export const ProfileResourceSpec = defineResource(CastMateBuiltInPlugin, {
	id: "Profile",
	state: {
		active: S.Boolean(),
	},
	config: {
		activationMode: S.Toggle(),
		triggers: S.Array(S.Trigger()),

		activationCondition: S.Boolean(), //Assuming this will be expressed??

		activationAutomation: S.InlineAutomation(),
		deactivationAutomation: S.InlineAutomation(),
	},
})

export type ProfileResource = Resource<typeof ProfileResourceSpec>
export type ProfileConfig = ProfileResource["config"]
export type ProfileState = ProfileResource["state"]
