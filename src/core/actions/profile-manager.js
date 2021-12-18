const { evalConditional, dependOnAllConditions } = require("../utils/conditionals");
const { Watcher } = require("../utils/reactive");
const { Profile } = require("./profiles");
const _ = require('lodash');
const chokidar = require("chokidar");
const { sleep } = require("../utils/sleep");
const path = require('path');
const { userFolder } = require("../utils/configuration");
const logger = require("../utils/logger");

class ProfileManager
{
	constructor(actions, plugins)
	{
		this.actions = actions;
		this.profiles = [];
		this.triggers = {};
		this.plugins = plugins;

		this.conditions = {};

		this.activeProfiles = [];
		this.inactiveProfiles = [];

	}

	async load()
	{
		//Setup file watching to hot reload any profile yaml files.
		this.profileWatcher = chokidar.watch(path.join(userFolder, 'profiles/'));

		this.profileWatcher.on('add', async (path) =>
		{
			logger.info(`Profile Added: ${path}`);
			await sleep(50); //Sleep because js is weird and we can accidentally load old files!
			await this.loadProfile(path);
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
		for (let plugin of this.plugins.plugins)
		{
			if (plugin.onProfileLoad)
				plugin.onProfileLoad(profile, profile.config);
		}

		
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

		await profile.reload();

		this.profiles.push(profile)

		await this.handleProfileLoaded(profile);
	}

	//Recalculate which profiles are active.
	recombine()
	{
		let [activeProfiles, inactiveProfiles] = _.partition(this.profiles, (profile) => evalConditional(profile.conditions, this.plugins.stateLookup));

		logger.info(`Combining Profiles: ${activeProfiles.map(p => p.filename).join(', ')}`);

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

		//Notify any plugins of profile changes.
		for (let plugin of this.plugins.plugins)
		{
			if (plugin.onProfilesChanged)
				plugin.onProfilesChanged(activeProfiles, inactiveProfiles);
		}
	}
}

module.exports = { ProfileManager };