const { Profile } = require("./profiles");


class ProfileManager
{
	constructor(actions)
	{
		this.actions = actions;
		this.profiles = [];
		this.triggers = {};
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
		this.triggers = Profile.mergeTriggers(this.profiles);
		this.actions.setTriggers(this.triggers);
	}
}

module.exports = { ProfileManager };