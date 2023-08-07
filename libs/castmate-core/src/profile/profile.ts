import { ProfileData, TriggerData } from "castmate-schema"
import { Resource, ResourceStorage } from "../resources/resource"
import { FileResource } from "../resources/file-resource"
import { nanoid } from "nanoid/non-secure"

export interface ProfileConfig extends ProfileData {}

export interface ProfileState {
	action: boolean
}

export class Profile extends FileResource<ProfileConfig, ProfileState> {
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
		}
	}
}
