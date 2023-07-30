import { Resource, RegisterResource, ResourceStorage } from "../resources/resource"

export interface ProfileConfig {}

export interface ProfileState {
	action: boolean
}

export class Profile extends Resource<ProfileConfig, ProfileState> {
	static storage = new ResourceStorage<Profile>()
}
