const { evalConditional, dependOnAllConditions } = require("../utils/conditionals");
const { Watcher } = require("../utils/reactive");
const { Profile } = require("./profiles");

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
			profile.watcher = new Watcher(() => this._recombine());
			dependOnAllConditions(profile.conditions, this.plugins.combinedState.__reactivity__, profile.watcher);
		});

		this.profiles.push(profile)
		profile.watcher = new Watcher(() => this._recombine());
		dependOnAllConditions(profile.conditions, this.plugins.combinedState.__reactivity__, profile.watcher);
	}

	_recombine()
	{
		let activeProfiles = this.profiles.filter((profile) => evalConditional(profile.conditions, this.plugins.combinedState));
		this.triggers = Profile.mergeTriggers(activeProfiles);

		this.actions.setTriggers(this.triggers);
	}

	setCondition(name, value)
	{
		this.conditions[name] = value;
		this._recombine();
	}
}

module.exports = { ProfileManager };