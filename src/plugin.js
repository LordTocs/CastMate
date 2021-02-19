class Plugin
{
	constructor(config)
	{
		this.name = config.name;
		this.initFunc = config.init;
		this.settings = config.settings || [];
		this.secrets = config.secrets || [];
		this.triggers = config.triggers || [];
		this.actions = config.actions || [];
	}

	async init(settings, secrets, webServices)
	{
		if (this.initFunc)
		{
			let pluginSettings = settings.data[this.name] || {};
			let pluginSecrets = secrets.data[this.name] || {};
			await this.initFunc(pluginSettings, pluginSecrets, webServices);
		}
	}
}

module.exports = {
	Plugin
}