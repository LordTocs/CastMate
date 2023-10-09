import { PluginManager } from "../plugins/plugin-manager"
import { Service } from "../util/service"
import { Profile } from "./profile"

export const ProfileManager = Service(
	class {
		private _activeProfiles: Profile[] = []
		private _inactiveProfiles: Profile[] = []

		get activeProfiles(): readonly Profile[] {
			return this._activeProfiles
		}

		get inactiveProfiles(): readonly Profile[] {
			return this._inactiveProfiles
		}

		recomputeActiveProfiles() {
			const active: Profile[] = []

			for (const profile of Profile.storage) {
				//TODO: State check
				active.push(profile)
			}

			const newActive = active.filter((p) => !this.activeProfiles.includes(p))
			const newInactive = active.filter((p) => this.activeProfiles.includes(p)) //TODO: Fix

			const needsUpdate = newActive.length > 0 || newInactive.length > 0
			if (!needsUpdate) return

			for (const newlyActive of newActive) {
				//TODO: OnProfileActivate
			}

			for (const newlyInactive of newInactive) {
				//TODO: OnProfileDeactivate
			}

			this._activeProfiles = active

			//Notify the UI

			PluginManager.getInstance().onProfilesChanged(this._activeProfiles, this._inactiveProfiles)
		}
	}
)
