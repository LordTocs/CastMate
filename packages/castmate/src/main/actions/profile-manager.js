import {
	evalConditional,
	dependOnAllConditions,
} from "../utils/conditionals.js"
import { Watcher } from "../state/reactive.js"
import { Profile } from "./profiles.js"
import _ from "lodash"
import YAML from "yaml"
import { sleep } from "../utils/sleep.js"
import path from "path"
import { userFolder } from "../utils/configuration.js"
import logger from "../utils/logger.js"
import { callIpcFunc, ipcFunc, ipcMain } from "../utils/electronBridge.js"
import fs from "fs"
import { StateManager } from "../state/state-manager.js"

export class ProfileManager {
	constructor(actions, plugins) {
		this.actions = actions
		this.profiles = []
		this.triggers = {}
		this.plugins = plugins

		this.conditions = {}

		this.activeProfiles = []
		this.inactiveProfiles = []

		this.recombiner = null

		ipcMain.handle("core_getActiveProfiles", () =>
			this.activeProfiles.map((p) => p.name)
		)

		this.createIOFuncs()
	}

	createIOFuncs() {
		ipcFunc("io", "getProfiles", () => {
			return this.profiles.map((p) => ({
				name: p.name,
				activationMode: p.activationMode,
			}))
		})
		ipcFunc("io", "getProfile", (name) => {
			const profile = this.profiles.find((p) => p.name === name)
			if (!profile) {
				console.log("Unable to find", name)
				return undefined
			}
			return profile.config
		})
		ipcFunc("io", "saveProfile", async (name, config) => {
			const profile = this.profiles.find((p) => p.name == name)
			if (profile) {
				await profile.saveConfig(config)
			}
		})
		ipcFunc(
			"io",
			"setProfileActivationMode",
			async (name, activationMode) => {
				const profile = this.profiles.find((p) => p.name == name)
				if (profile) {
					await profile.setActivationMode(activationMode)
				}
			}
		)
		ipcFunc("io", "createProfile", async (name, config) => {
			const existingProfile = this.profiles.find((p) => p.name == name)
			if (existingProfile) return false

			const newProfile = new Profile(
				path.join(userFolder, "profiles", `${name}.yaml`),
				this,
				(profile) => {
					this.handleProfileLoaded(profile)
				}
			)

			const finalConfig = {
				version: "2.0",
				triggers: {},
				conditions: { operator: "any", operands: [] },
			}

			if (config) {
				Object.assign(finalConfig, config)
			}

			await newProfile.saveConfig(finalConfig)

			this.profiles.push(newProfile)

			await this.handleProfileLoaded(newProfile)

			return true
		})
		ipcFunc("io", "deleteProfile", async (name) => {
			const profileIndex = this.profiles.findIndex((p) => p.name == name)

			if (profileIndex < 0) return false

			try {
				await fs.promises.unlink(this.profiles[profileIndex].filename)
			} catch (err) {
				logger.error(`Failed to delete profile ${name}: ${err}`)
			}

			this.profiles[profileIndex].watcher.unsubscribe()
			this.profiles.splice(profileIndex, 1)

			this.recombine()

			logger.info(`Profile Deleted: ${name}`)

			return true
		})
		ipcFunc("io", "cloneProfile", async (name, newName) => {
			const profileIndex = this.profiles.findIndex((p) => p.name == name)

			if (profileIndex < 0) return false

			const existingProfile = this.profiles.find((p) => p.name == newName)
			if (existingProfile) return false

			const config = _.cloneDeep(this.profiles[profileIndex].config)

			const newProfile = new Profile(
				path.join(userFolder, "profiles", `${newName}.yaml`),
				this,
				(profile) => {
					this.handleProfileLoaded(profile)
				}
			)

			await newProfile.saveConfig(config)
			await this.handleProfileLoaded(newProfile)

			this.profiles.push(newProfile)

			return true
		})

		ipcFunc("io", "renameProfile", async (name, newName) => {
			const profileIndex = this.profiles.findIndex((p) => p.name == name)

			if (profileIndex < 0) return false

			const existingProfile = this.profiles.find((p) => p.name == newName)
			if (existingProfile) return false

			const profile = this.profiles[profileIndex]
			await profile.rename(
				newName,
				path.join(userFolder, "profiles", `${newName}.yaml`)
			)

			return true
		})
	}

	async load() {
		//Setup file watching to hot reload any profile yaml files.
		this.isLoading = true

		const files = await fs.promises.readdir(
			path.join(userFolder, "profiles/")
		)
		const profileFiles = files.filter((f) => path.extname(f) == ".yaml")

		await Promise.all(
			profileFiles.map(async (f) => {
				try {
					const filename = path.join(userFolder, "profiles/", f)

					let profile = new Profile(filename, this, (profile) => {
						this.handleProfileLoaded(profile)
					})

					//Load the config from file and setup the profile object.
					await profile.load()

					//Add it to the profile list
					this.profiles.push(profile)

					//Tell it to notify any plugins of profile loads, recombine any active profiles, and setup any state dependencies
					await this.handleProfileLoaded(profile)
				} catch (err) {
					logger.error(`Failed to load profile ${f} : ${err}`)
				}
			})
		)

		this.isLoading = false

		this.recombine()
	}

	//Force all profiles to re-calculate their dependencies on reactive state.
	async redoDependencies() {
		for (let profile of this.profiles) {
			if (!profile.watcher) continue //Watcher hasn't been created so we don't have to do anything.

			profile.watcher.unsubscribe()

			//create a new watcher
			profile.watcher = await Watcher.watchAsyncWithScheduler(
				async () => await this.recombine(),
				() => this.markForRecombine(),
				"Recombiner"
			)

			/*dependOnAllConditions(
				profile.conditions,
				StateManager.getInstance().rootState,
				profile.watcher
			)*/
		}
	}

	async handleProfileLoaded(profile) {
		//Notify any plugins that a profile has loaded.
		const onProfileLoadPromises = []
		for (let plugin of this.plugins.plugins) {
			if (plugin.onProfileLoad)
				onProfileLoadPromises.push(
					plugin.onProfileLoad(profile, profile.config)
				)
		}
		await Promise.all(onProfileLoadPromises)

		//Setup the state watcher used for profile conditions.
		if (profile.watcher) {
			// Deactivate the old watcher if it exists.
			profile.watcher.unsubscribe()
		}

		// // Recombine active profiles
		profile.watcher = await Watcher.watchAsyncWithScheduler(
			async () => {
				return await this.recombine()
			},
			() => this.markForRecombine(),
			"Recombiner"
		)
	}

	markForRecombine() {
		if (this.recombiner) {
			return
		}
		this.recombiner = setTimeout(() => {
			this.recombiner = null
			this.recombine()
		}, 100)
	}

	async calculateActiveProfiles() {
		const activityList = await Promise.all(
			this.profiles.map(async (p) => await p.shouldBeActive())
		)

		const activeProfiles = []
		const inactiveProfiles = []

		for (let i = 0; i < this.profiles.length; ++i) {
			const profile = this.profiles[i]
			const active = activityList[i]

			if (active) {
				activeProfiles.push(profile)
			} else {
				inactiveProfiles.push(profile)
			}
		}

		return [activeProfiles, inactiveProfiles]
	}

	//Recalculate which profiles are active.
	async recombine() {
		const [activeProfiles, inactiveProfiles] =
			await this.calculateActiveProfiles()

		if (this.isLoading) {
			//Don't recombine during initial load this causes async issues!
			//console.log("No Recombine during load")
			return
		}

		logger.info(
			`Combining Profiles: ${activeProfiles
				.map((p) => p.name)
				.join(", ")}`
		)

		this.triggers = Profile.mergeTriggers(activeProfiles)

		//Tell the action queue what our merged triggers are.
		this.actions.setTriggers(this.triggers)

		for (let p of this.activeProfiles) {
			if (inactiveProfiles.includes(p)) {
				//Active profile is now inactive.
				if (p.onDeactivate) {
					this.actions.startAutomation(p.onDeactivate, {})
				}
			}
		}

		for (let p of this.inactiveProfiles) {
			if (activeProfiles.includes(p)) {
				//Inactive profile is now active
				if (p.onActivate) {
					this.actions.startAutomation(p.onActivate, {})
				}
			}
		}

		this.inactiveProfiles = inactiveProfiles
		this.activeProfiles = activeProfiles

		callIpcFunc(
			"queues_setActiveProfiles",
			activeProfiles.map((p) => p.name)
		)

		//Notify any plugins of profile changes.
		for (let plugin of this.plugins.plugins) {
			if (plugin.onProfilesChanged) {
				try {
					plugin.onProfilesChanged(activeProfiles, inactiveProfiles)
				} catch (err) {
					logger.error(
						`Error Triggering onProfilesChanged ${plugin.name}.\n${err}`
					)
				}
			}
		}
	}
}
