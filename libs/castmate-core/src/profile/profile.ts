import { ProfileData, Sequence, TriggerData } from "castmate-schema"
import { Resource, ResourceStorage } from "../resources/resource"
import { FileResource } from "../resources/file-resource"
import { nanoid } from "nanoid/non-secure"

export interface SequenceProvider {
	getSequence(id: string): Sequence | undefined
}

export interface ProfileConfig extends ProfileData {}

export interface ProfileState {
	action: boolean
}

export class Profile extends FileResource<ProfileConfig, ProfileState> implements SequenceProvider {
	static resourceDirectory: string = "./profiles"
	static storage = new ResourceStorage<Profile>("Profile")

	constructor(name?: string) {
		super()

		if (name) {
			this._id = nanoid()
		}

		this._config = {
			name: name ?? "",
			activationMode: "toggle",
			triggers: [],
			activationCondition: {
				operator: "or",
				operands: [],
			},
		}
	}

	getSequence(id: string): Sequence | undefined {
		const trigger = this.config.triggers.find((t) => t.id == id)
		if (trigger) {
			return trigger.sequence
		}

		return undefined
	}
}
