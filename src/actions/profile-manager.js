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

		this.twitchPlugin = this.plugins.plugins.find((p) => p.name == "twitch");
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
		});

		this.profiles.push(profile)
		profile.watcher = new Watcher(() => this.recombine());
		dependOnAllConditions(profile.conditions, this.plugins.combinedState.__reactivity__, profile.watcher);
	}

	recombine()
	{
		let [activeProfiles, inactiveProfiles] = _.partition(this.profiles, (profile) => evalConditional(profile.conditions, this.plugins.combinedState));

		this.triggers = Profile.mergeTriggers(activeProfiles);

		this.actions.setTriggers(this.triggers);

		let activeRewards = new Set();
		let inactiveRewards = new Set();
		//Handle rewards
		for (let activeProf of activeProfiles)
		{
			for (let reward of activeProf.rewards)
			{
				activeRewards.add(reward);
			}
		}

		for (let inactiveProf of inactiveProfiles)
		{
			for (let reward of inactiveProf.rewards)
			{
				inactiveRewards.add(reward);
			}
		}

		//Set all the reward states.
		//Hackily reach inside twitch plugin.
		this.twitchPlugin.pluginObj.switchChannelRewards(activeRewards, inactiveRewards);
	}

	setCondition(name, value)
	{
		this.conditions[name] = value;
		this.recombine();
	}
}

module.exports = { ProfileManager };