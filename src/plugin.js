class Plugin
{
	constructor(config)
	{
		this.pluginObj = {};

		this.name = config.name;
		this.initFunc = config.init;
		if (this.initFunc)
		{
			this.initFunc = this.initFunc.bind(this.pluginObj);
		}
		this.settings = config.settings || [];
		this.secrets = config.secrets || [];
		this.triggers = config.triggers || [];
		this.actions = config.actions || [];

		for (let action of this.actions)
		{
			if (action.handler)
			{
				action.handler = action.handler.bind(this.pluginObj);
			}
		}
	}

	async init(settings, secrets, actions, webServices)
	{
		if (this.initFunc)
		{
			let pluginSettings = settings.data[this.name] || {};
			let pluginSecrets = secrets.data[this.name] || {};

			this.pluginObj.settings = pluginSettings;
			this.pluginObj.secrets = pluginSecrets;
			this.pluginObj.webServices = webServices;
			this.pluginObj.actions = actions;

			await this.initFunc();
		}
	}

	async updateSettings(settings)
	{
		let pluginSettings = settings[this.name] || {};
		this.pluginObj.settings = pluginSettings;

		//TODO: Fire Event
	}

	async updateSecrets(secrets)
	{
		let pluginSecrets = secrets[this.name] || {};
		this.pluginObj.pluginSecrets = pluginSecrets;

		//TODO: Fire Event
	}

}

module.exports = {
	Plugin
}