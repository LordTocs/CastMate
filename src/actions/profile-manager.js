const { evalConditional, dependOnAllConditions } = require("../utils/conditionals");
const { Watcher } = require("../utils/reactive");
const { Profile } = require("./profiles");
const _ = require('lodash');

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

	loadProfile(filename)
	{
		let profile = new Profile(filename, (profile) =>
		{
			//destroy existing watcher.
			profile.watcher.unsubscribe();

			//create a new watcher
			profile.watcher = new Watcher(() => this.recombine());
			dependOnAllConditions(profile.conditions, this.plugins.combinedState.__reactivity__, profile.watcher);

			for (let plugin of this.plugins.plugins)
			{
				if (plugin.onProfileLoad)
					plugin.onProfileLoad(profile, profile.config);
			}

		});

		this.profiles.push(profile)
		profile.watcher = new Watcher(() => this.recombine());
		dependOnAllConditions(profile.conditions, this.plugins.combinedState.__reactivity__, profile.watcher);

		for (let plugin of this.plugins.plugins)
		{
			if (plugin.onProfileLoad)
				plugin.onProfileLoad(profile, profile.config);
		}
	}

	recombine()
	{
		let [activeProfiles, inactiveProfiles] = _.partition(this.profiles, (profile) => evalConditional(profile.conditions, this.plugins.combinedState));

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