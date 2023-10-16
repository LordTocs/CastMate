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

		private inited: boolean = false

		async finishSetup() {
			await Promise.all(Array.from(Profile.storage).map((p) => p.forceActivationRecompute()))

			this.inited = true

			this.recomputeActiveProfiles()
		}

		private activeProfileChange = false
		signalProfilesChanged() {
			if (!this.activeProfileChange && this.inited) {
				this.activeProfileChange = true
				process.nextTick(() => this.recomputeActiveProfiles())
			}
		}

		private recomputeActiveProfiles() {
			if (!this.inited) return

			const active: Profile[] = []
			const inactive: Profile[] = []

			for (const profile of Profile.storage) {
				if (profile.state.active) {
					active.push(profile)
				} else {
					inactive.push(profile)
				}
			}

			const newActive = active.filter((p) => !this.activeProfiles.includes(p))
			const newInactive = inactive.filter((p) => !this.inactiveProfiles.includes(p))

			for (const newlyActive of newActive) {
				//TODO: OnProfileActivate
			}

			for (const newlyInactive of newInactive) {
				//TODO: OnProfileDeactivate
			}

			console.log(
				"Active Profiles",
				active.map((p) => p.config.name)
			)
			console.log(
				"Inactive Profiles",
				inactive.map((p) => p.config.name)
			)

			this._activeProfiles = active
			this._inactiveProfiles = inactive

			//Notify the UI
			PluginManager.getInstance().onProfilesChanged(this._activeProfiles, this._inactiveProfiles)

			this.activeProfileChange = false
		}
	}
)
