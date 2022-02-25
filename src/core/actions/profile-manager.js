const { evalConditional, dependOnAllConditions } = require("../utils/conditionals");
const { Watcher } = require("../utils/reactive");
const { Profile } = require("./profiles");
const _ = require('lodash');
const chokidar = require("chokidar");
const { sleep } = require("../utils/sleep");
const path = require('path');
const { userFolder } = require("../utils/configuration");
const logger = require("../utils/logger");
const { ipcMain } = require("electron");

class ProfileManager
{
	constructor(actions, plugins, ipcSender)
	{
		this.actions = actions;
		this.profiles = [];
		this.triggers = {};
		this.plugins = plugins;

		this.conditions = {};

		this.activeProfiles = [];
		this.inactiveProfiles = [];

		this.ipcSender = ipcSender;

		ipcMain.handle("core_getActiveProfiles", () => this.activeProfiles.map(p => p.name));
	}

	async load()
	{
		//Setup file watching to hot reload any profile yaml files.
		this.profileWatcher = chokidar.watch(path.join(userFolder, 'profiles/'));

		this.isLoading = true;
		this.asyncLoadingPromises = [];

		this.profileWatcher.on('add', async (path) =>
		{
			logger.info(`Profile Added: ${path}`);
			
			const loadPromise = this.loadProfile(path);
			if (this.isLoading)
			{
				this.asyncLoadingPromises.push(loadPromise);
			}
			await loadPromise;
		});
		this.profileWatcher.on('change', async (path) =>
		{
			logger.info(`Profile Changed: ${path}`);
			let profile = this.profiles.find((p) => p.filename == path);

			if (!profile) return;

			await sleep(50); //Sleep because js is weird and we can accidentally load old files!

			await profile.handleFileChanged(path);
		});
		this.profileWatcher.on('unlink', (path) =>
		{
			let i = this.profiles.findIndex((p) => p.filename == path);
			if (i == -1) return;

			logger.info(`Profile Deleted: ${path}`);

			this.profiles[i].watcher.unsubscribe();
			this.profiles.splice(i, 1);

			this.recombine();
		});

		this.profileWatcher.on('ready', async () => {
			await Promise.all(this.asyncLoadingPromises);

			console.log("All Profiles Loaded.")

			this.isLoading = false;
			
			this.recombine();
		})
	}

	//Force all profiles to re-calculate their dependencies on reactive state.
	redoDependencies()
	{
		for (let profile of this.profiles)
		{
			if (!profile.watcher)
				continue; //Watcher hasn't been created so we don't have to do anything.

			profile.watcher.unsubscribe();

			//create a new watcher
			profile.watcher = new Watcher(() => this.recombine(), { fireImmediately: false });
			this.recombine();
			dependOnAllConditions(profile.conditions, this.plugins.stateLookup, profile.watcher);
		}
	}

	async handleProfileLoaded(profile)
	{
		//Notify any plugins that a profile has loaded.
		const onProfileLoadPromises = [];
		for (let plugin of this.plugins.plugins)
		{
			if (plugin.onProfileLoad)
				onProfileLoadPromises.push(plugin.onProfileLoad(profile, profile.config));
		}
		await Promise.all(onProfileLoadPromises);

		
		//Setup the state watcher used for profile conditions.
		if (profile.watcher)
		{
			profile.watcher.unsubscribe();
		}
		profile.watcher = new Watcher(() => this.recombine(), { fireImmediately: false });
		
		this.recombine();
		
		
		dependOnAllConditions(profile.conditions, this.plugins.stateLookup, profile.watcher);
	}

	//Load in a new profile.
	async loadProfile(filename)
	{
		let profile = new Profile(filename, this, (profile) =>
		{
			this.handleProfileLoaded(profile);
		});

		await sleep(50); //Sleep because js is weird and we can accidentally load old files!

		await profile.reload();

		this.profiles.push(profile)

		await this.handleProfileLoaded(profile);
	}

	//Recalculate which profiles are active.
	recombine()
	{
		if (this.isLoading)
		{
			//Don't recombine during initial load this causes async issues!
			return;
		}

		let [activeProfiles, inactiveProfiles] = _.partition(this.profiles, (profile) => evalConditional(profile.conditions, this.plugins.stateLookup));

		logger.info(`Combining Profiles: ${activeProfiles.map(p => p.name).join(', ')}`);


		this.triggers = Profile.mergeTriggers(activeProfiles);

		//Tell the action queue what our merged triggers are.
		this.actions.setTriggers(this.triggers);

		for (let p of this.activeProfiles)
		{
			if (inactiveProfiles.includes(p))
			{
				//Active profile is now inactive.
				if (p.onDeactivate)
				{
					this.actions.startAutomation(p.onDeactivate, {});
				}
			}
		}

		for (let p of this.inactiveProfiles)
		{
			if (activeProfiles.includes(p))
			{
				//Inactive profile is now active
				if (p.onDeactivate)
				{
					this.actions.startAutomation(p.onActivate, {});
				}
			}
		}

		this.inactiveProfiles = inactiveProfiles;
		this.activeProfiles = activeProfiles;

		this.ipcSender.send('profiles-active', activeProfiles.map(p => p.name))

		//Notify any plugins of profile changes.
		for (let plugin of this.plugins.plugins)
		{
			if (plugin.onProfilesChanged)
				plugin.onProfilesChanged(activeProfiles, inactiveProfiles);
		}
	}
}

module.exports = { ProfileManager };