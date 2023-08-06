import { ProfileData, TriggerData } from "castmate-schema"
import { Resource, ResourceStorage } from "../resources/resource"
import { FileResource } from "../resources/file-resource"

export interface ProfileConfig extends ProfileData {
}

export interface ProfileState {
	action: boolean
}

export class Profile extends FileResource<ProfileConfig, ProfileState> {
	static resourceDirectory: string = "./profiles"
	static storage = new ResourceStorage<Profile>("Profile")
}
