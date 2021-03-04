const { reactify } = require("./reactive");

class Plugin
{
	constructor(config)
	{
		this.pluginObj = {};

		this.name = config.name;
		console.log(`Loading Plugin: ${config.name}`);
		this.initFunc = config.init;
		//Bind the init func to the pluginObj
		if (this.initFunc)
		{
			this.initFunc = this.initFunc.bind(this.pluginObj);
		}

		this.onProfilesChanged = config.onProfilesChanged;

		if (this.onProfilesChanged)
		{
			this.onProfilesChanged = this.onProfilesChanged.bind(this.pluginObj);
		}

		this.onProfileLoad = config.onProfileLoad;

		if (this.onProfileLoad)
		{
			this.onProfileLoad = this.onProfileLoad.bind(this.pluginObj);
		}

		this.onWebsocketMessage = config.onWebsocketMessage;

		if (this.onWebsocketMessage)
		{
			this.onWebsocketMessage = this.onWebsocketMessage.bind(this.pluginObj);
		}

		this.settings = config.settings || [];
		this.secrets = config.secrets || [];
		this.triggers = config.triggers || [];
		this.actions = {};

		//Pass the methods onto the plugin object for use.
		if (config.methods)
		{
			Object.assign(this.pluginObj, config.methods);
		}

		//Bind all the action handlers to the pluginObj so 'this' works correctly.
		for (let actionKey in config.actions)
		{
			let action = config.actions[actionKey];
			if (action.handler)
			{
				action.handler = action.handler.bind(this.pluginObj);
			}
			this.actions[actionKey] = action;
		}

		//Create all the state.
		this.pluginObj.state = {};
		for (let stateKey in config.state)
		{
			this.pluginObj.state[stateKey] = null;
		}
		reactify(this.pluginObj.state);
	}

	async init(settings, secrets, actions, profiles, webServices, plugins)
	{
		let pluginSettings = settings.data[this.name] || {};
		let pluginSecrets = secrets.data[this.name] || {};

		this.pluginObj.settings = pluginSettings;
		this.pluginObj.secrets = pluginSecrets;
		this.pluginObj.webServices = webServices;
		this.pluginObj.actions = actions;
		this.pluginObj.profiles = profiles;
		this.pluginObj.plugins = plugins;

		if (this.initFunc)
		{
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