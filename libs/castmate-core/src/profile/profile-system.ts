import { Service } from "../util/service"
import { Profile } from "./profile"

export const ProfileManager = Service(
	class {
		private _activeProfiles: Profile[] = []

		get activeProfiles(): readonly Profile[] {
			return this._activeProfiles
		}

		recomputeActiveProfiles() {
			const active: Profile[] = []

			for (const profile of Profile.storage) {
				//TODO: State check
				active.push(profile)
			}

			const newActive = active.filter((p) => !this.activeProfiles.includes(p))
			const newInactive = active.filter((p) => this.activeProfiles.includes(p))

			for (const newlyActive of newActive) {
				//TODO: OnProfileActivate
			}

			for (const newlyInactive of newInactive) {
				//TODO: OnProfileDeactivate
			}

			this._activeProfiles = active

			//Notify the UI
		}
	}
)
