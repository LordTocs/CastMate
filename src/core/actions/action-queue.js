const { sleep } = require("../utils/sleep.js");
const { Mutex } = require("async-mutex");
const { reactiveCopy } = require("../utils/reactive.js");
const logger = require('../utils/logger');
const { ipcMain } = require("electron");
const _ = require('lodash');

class ActionQueue {
	constructor(plugins, automations) {
		this.triggerMappings = {};
		this.triggerHandlers = {};

		this.automations = automations;

		//Queue of automations to run synchronously.
		this.queue = [];
		this.syncAutomationPromise = null;
		this.queueMutex = new Mutex();

		this.actions = {};
		for (let plugin of plugins.plugins) {
			this.actions[plugin.name] = {}
			for (let actionKey in plugin.actions) {
				this.actions[plugin.name][actionKey] = plugin.actions[actionKey];
			}

			this.triggerHandlers[plugin.name] = {};
			for (let triggerName in plugin.triggers) {
				this.triggerHandlers[plugin.name][triggerName] = plugin.triggers[triggerName].handler
			}
		}

		this.plugins = plugins;

		ipcMain.handle('core_runActions', async (event, actions, context) => {
			const automation = { actions, sync: false };

			this.pushToQueue(automation, context || {
				//Some dummy data.
				user: "Test User",
				userColor: "#4411FF",
				message: "Test Message From User",
				filteredMessage: "Test Message From User",
			})
		})

		ipcMain.handle('core_runAutomation', async (event, automationName, context) => {
			this.startAutomation(automationName, context)
		})
	}

	setTriggers(triggers) {
		this.triggerMappings = triggers;
	}

	convertOffsets(actions) {
		let timeSinceStart = 0;

		for (let a of actions) {
			if (a.timestamp) {
				a.beforeDelay = a.timestamp - timeSinceStart;
				timeSinceStart = a.timestamp;
			}
		}
	}

	async startAutomation(automationName, context) {
		const automation = this.automations.get(automationName)

		if (!automation) {
			logger.error(`Missing Automation: ${automationName}`);
		}

		this.pushToQueue(automation, context);
	}

	_prepAutomation(automation) {
		if (!(automation.actions instanceof Array)) {
			logger.error("Automations must have an actions array.");
			return false;
		}

		if (automation.actions.length == 0) {
			logger.error("Automations shouldn't be empty.");
			return false;
		}

		automation.sync = !!automation.sync; //ensure that sync exists and is a bool.

		this.convertOffsets(automation.actions);
	}

	async pushToQueue(automation, context) {
		//Build our complete context.
		let completeContext = { ...context };
		_.merge(completeContext, this.plugins.templateFunctions);
		//merge won't work with reactive props, manually go deep here.
		for (let pluginKey in this.plugins.stateLookup) {
			if (!(pluginKey in completeContext)) {
				completeContext[pluginKey] = {};
			}
			reactiveCopy(completeContext[pluginKey], this.plugins.stateLookup[pluginKey]);
		}

		this._prepAutomation(automation);

		if (automation.sync) {
			//Push to the queue
			let release = await this.queueMutex.acquire();
			this.queue.push({ automation, context: completeContext });
			release();

			this._runStartOfQueue();
		}
		else {
			this._runAutomation(automation, completeContext);
		}
	}

	trigger(plugin, name, options) {
		const pluginHandlers = this.triggerHandlers[plugin];
		if (!pluginHandlers) {
			return false;
		}
		let triggerHandler = this.triggerHandlers[plugin][name];

		if (!triggerHandler) {
			return false;
		}
		const triggerPluginMappings = this.triggerMappings[plugin];
		if (!triggerPluginMappings) {
			return false;
		}
		const triggerMappings = this.triggerMappings[plugin][name];
		if (!triggerMappings) {
			return false;
		}

		return triggerHandler.handle(this, triggerMappings, options);
	}


	async _runAutomation(automation, context) {
		for (let action of automation.actions) {
			await this._runAction(action, context);
		}
	}


	async _runAction(action, context) {
		//Before delay is used by our offset calculations so it must stay.
		if (action.beforeDelay) {
			await sleep(action.beforeDelay * 1000);
		}

		const pluginActions = this.actions[action.plugin];
		if (pluginActions) {
			if (action.action in pluginActions) {
				pluginActions[action.action].handler(action.data, context).catch((reason) => {
					console.error(`${subAction} threw Exception!`);
					console.error(reason);
				});
			}
		}

		if (action.plugin === "castmate") {
			if (action.action === "automation") {
				const subAutomationName = action.automation.automation;
				const subAutomation = this.automations.get(subAutomationName);
				this._prepAutomation(subAutomation);
				await this._runAutomation(subAutomation);
			}

			if (action.action === "delay") {
				await sleep(action.delay * 1000);
			}
		}
	}

	async _runNext() {
		if (this.queue.length > 0) {
			let release = await this.queueMutex.acquire();
			let frontAutomation = this.queue.shift();
			let frontPromise = this._runAutomation(frontAutomation.automation, frontAutomation.context);
			this.syncAutomationPromise = frontPromise;
			this.syncAutomationPromise.then(() => this._runNext());
			release();
		}
		else {
			this.syncAutomationPromise = null;
		}
	}

	async _runStartOfQueue() {
		if (this.syncAutomationPromise)
			return;

		if (this.queue.length == 0)
			return;

		logger.info("Starting new synchronous automation chain");
		let release = await this.queueMutex.acquire();
		let frontAutomation = this.queue.shift();
		let frontPromise = this._runAutomation(frontAutomation.automation, frontAutomation.context);
		this.syncAutomationPromise = frontPromise;
		this.syncAutomationPromise.then(() => this._runNext());
		release();
	}
}

module.exports = { ActionQueue }