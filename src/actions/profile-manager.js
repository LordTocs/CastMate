const { evalConditional } = require("../utils/contiondals");
const { Profile } = require("./profiles");

class ProfileManager
{
	constructor(actions)
	{
		this.actions = actions;
		this.profiles = [];
		this.triggers = {};

		this.conditions = {};
	}

	loadProfile(filename)
	{
		this.profiles.push(new Profile(filename, () =>
		{
			this._recombine();
		}))
		this._recombine(); //This should only happen after the initial load?
	}

	_recombine()
	{
		let activeProfiles = this.profiles.filter((profile) => evalConditional(profile.conditions, this.conditions));
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