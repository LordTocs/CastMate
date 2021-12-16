const { sleep } = require("../utils/sleep.js");
const { Mutex } = require("async-mutex");
const { reactiveCopy } = require("../utils/reactive.js");
const logger = require('../utils/logger');
const { ipcMain } = require("electron");

class ActionQueue
{
	constructor(plugins, automations)
	{
		this.triggerMappings = {};
		this.triggerHandlers = {};

		this.automations = automations;

		//Queue of automations to run synchronously.
		this.queue = [];
		this.syncAutomationPromise = null;
		this.queueMutex = new Mutex();

		//Convert plugins into action lookup table
		this.actions = {};
		for (let plugin of plugins.plugins)
		{
			for (let actionKey in plugin.actions)
			{
				this.actions[actionKey] = plugin.actions[actionKey];
			}

			for (let triggerName in plugin.triggers)
			{
				this.triggerHandlers[triggerName] = plugin.triggers[triggerName].handler
			}
		}

		this.plugins = plugins;

		ipcMain.handle('pushToQueue', async (event, actions) =>
		{
			const automation = { actions, sync: false };

			this.pushToQueue(automation, {
				//Some dummy data.
				user: "Test User",
				userColor: "#4411FF",
				message: "Test Message From User",
				filteredMessage: "Test Message From User",
			})
		})

		ipcMain.handle('core_runActions', async (event, actions, context) =>
		{
			const automation = { actions, sync: false };

			this.pushToQueue(automation, context || {
				//Some dummy data.
				user: "Test User",
				userColor: "#4411FF",
				message: "Test Message From User",
				filteredMessage: "Test Message From User",
			})
		})

		ipcMain.handle('core_runAutomation', async (event, automationName, context) =>
		{
			this.startAutomation(automationName, context)
		})
	}

	setTriggers(triggers)
	{
		this.triggerMappings = triggers;
	}

	convertOffsets(actions)
	{
		let timeSinceStart = 0;

		for (let a of actions)
		{
			if (a.timestamp)
			{
				a.beforeDelay = a.timestamp - timeSinceStart;
				timeSinceStart = a.timestamp;
			}
		}
	}

	async startAutomation(automationName, context)
	{
		const automation = this.automations.get(automationName)

		if (!automation)
		{
			logger.error(`Missing Automation: ${automationName}`);
		}

		this.pushToQueue(automation, context);
	}

	_prepAutomation(automation)
	{
		if (!(automation.actions instanceof Array))
		{
			logger.error("Automations must have an actions array.");
			return false;
		}

		if (automation.actions.length == 0)
		{
			logger.error("Automations shouldn't be empty.");
			return false;
		}

		automation.sync = !!automation.sync; //ensure that sync exists and is a bool.

		this.convertOffsets(automation.actions);
	}

	async pushToQueue(automation, context)
	{
		//Build our complete context.
		let completeContext = { ...context, ...this.plugins.combinedTemplateFunctions };
		//Reactively copy in combinedState incase it's mutated mid action.
		reactiveCopy(completeContext, this.plugins.combinedState);

		this._prepAutomation(automation);

		if (automation.sync)
		{
			//Push to the queue
			let release = await this.queueMutex.acquire();
			this.queue.push({ automation, context: completeContext });
			release();

			this._runStartOfQueue();
		}
		else
		{
			this._runAutomation(automation, completeContext);
		}
	}

	trigger(name, options)
	{
		let triggerHandler = this.triggerHandlers[name];

		if (!triggerHandler)
		{
			return false;
		}

		const triggerMappings = this.triggerMappings[name];
		if (!triggerMappings)
		{
			return false;
		}

		return triggerHandler.handle(this, triggerMappings, options);
	}


	async _runAutomation(automation, context)
	{
		for (let action of automation.actions)
		{
			await this._runAction(action, context);
		}
	}


	async _runAction(action, context)
	{
		//Before delay is used by our offset calculations so it must stay.
		if (action.beforeDelay)
		{
			await sleep(action.beforeDelay * 1000);
		}

		for (let subAction in action) //Technically we iterate but there should never be more than one action per object.
		{
			if (subAction in this.actions)
			{
				this.actions[subAction].handler(action[subAction], context).catch((reason) =>
				{
					console.error(`${subAction} threw Exception!`);
					console.error(reason);
				});
			}

			if (subAction == 'automation')
			{
				const subAutomationName = action.automation.automation;
				const subAutomation = this.automations.get(subAutomationName);
				this._prepAutomation(subAutomation);
				await this._runAutomation(subAutomation);
			}

			if (subAction == 'delay')
			{
				await sleep(action.delay.delay);
			}
		}
	}

	async _runNext()
	{
		if (this.queue.length > 0)
		{
			let release = await this.queueMutex.acquire();
			let frontAutomation = this.queue.shift();
			let frontPromise = this._runAutomation(frontAutomation.automation, frontAutomation.context);
			this.syncAutomationPromise = frontPromise;
			this.syncAutomationPromise.then(() => this._runNext());
			release();
		}
		else
		{
			this.syncAutomationPromise = null;
		}
	}

	async _runStartOfQueue()
	{
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