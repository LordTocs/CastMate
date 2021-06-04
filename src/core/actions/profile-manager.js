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

	}

	async load()
	{
		this.profileWatcher = chokidar.watch(path.join(userFolder, 'profiles/'));
		this.triggersWatcher = chokidar.watch(path.join(userFolder, 'triggers/'));
		this.sequencesWatcher = chokidar.watch(path.join(userFolder, 'sequences/'));

		this.profileWatcher.on('add', async (path) =>
		{
			logger.info(`Profile Added: ${path}`);
			await sleep(50);
			this.loadProfile(path);
		});
		this.profileWatcher.on('change', async (path) =>
		{
			logger.info(`Profile Changed: ${path}`);
			let profile = this.profiles.find((p) => p.filename == path);

			if (!profile) return;

			await sleep(50);

			profile.handleFileChanged(path);
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

		this.triggersWatcher.on('change', async (path) =>
		{
			logger.info(`Triggers Changed: ${path}`);
			await sleep(50);
			for (let profile of this.profiles)
			{
				profile.handleFileChanged(path);
			}
		})

		this.sequencesWatcher.on('change', async (path) =>
		{
			await sleep(50);
			logger.info(`Sequence Changed: ${path}`);
			for (let profile of this.profiles)
			{
				profile.handleFileChanged(path);
			}
		})
	}


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
			dependOnAllConditions(profile.conditions, this.plugins.combinedState.__reactivity__, profile.watcher);
		}
	}

	loadProfile(filename)
	{
		let profile = new Profile(filename, (profile) =>
		{
			for (let plugin of this.plugins.plugins)
			{
				if (plugin.onProfileLoad)
					plugin.onProfileLoad(profile, profile.config);
			}

			//destroy existing watcher.
			profile.watcher.unsubscribe();

			//create a new watcher
			profile.watcher = new Watcher(() => this.recombine(), { fireImmediately: false });
			this.recombine();
			dependOnAllConditions(profile.conditions, this.plugins.combinedState.__reactivity__, profile.watcher);
		});

		this.profiles.push(profile)

		for (let plugin of this.plugins.plugins)
		{
			if (plugin.onProfileLoad)
				plugin.onProfileLoad(profile, profile.config);
		}

		profile.watcher = new Watcher(() => this.recombine(), { fireImmediately: false });
		this.recombine();
		dependOnAllConditions(profile.conditions, this.plugins.combinedState.__reactivity__, profile.watcher);
	}

	recombine()
	{
		let [activeProfiles, inactiveProfiles] = _.partition(this.profiles, (profile) => evalConditional(profile.conditions, this.plugins.combinedState));

		logger.info(`Combining Profiles: ${activeProfiles.map(p => p.filename).join(', ')}`);

		this.triggers = Profile.mergeTriggers(activeProfiles);

		this.actions.setTriggers(this.triggers);

		for (let plugin of this.plugins.plugins)
		{
			if (plugin.onProfilesChanged)
				plugin.onProfilesChanged(activeProfiles, inactiveProfiles);
		}
	}

	setCondition(name, value)
	{
		this.conditions[name] = value;
		this.recombine();
	}
}

module.exports = { ProfileManager };