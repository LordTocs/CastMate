const { sleep } = require("../utils/sleep.js");
const { Mutex } = require("async-mutex");

function isActionable(actionable)
{
	if (actionable instanceof Array)
	{
		return true;
	}
	else if ("actions" in actionable)
	{
		return true;
	}
	else if ("oneOf" in actionable)
	{
		return true;
	}
	return false;
}

function getActionArray(actionDef)
{
	if (actionDef instanceof Array)
	{
		return actionDef;
	}
	else if ("oneOf" in actions)
	{
		return actions.oneOf[Math.floor(Math.random() * actions.oneOf.length)];
	}
	return null;
}

class ActionQueue
{
	constructor(plugins)
	{
		this.triggers = {};
		this.queue = [];
		this.currentAction = null;
		this.queueMutex = new Mutex();

		//Convert plugins into action lookup table
		this.actions = {};
		for (let plugin of plugins)
		{
			for (let actionKey in plugin.actions)
			{
				this.actions[actionKey] = plugin.actions[actionKey];
			}
		}
	}

	setTriggers(triggers)
	{
		this.triggers = triggers;
	}



	async pushToQueue(actionDef, context)
	{
		let actionArray = null;
		let isSync = false;

		if ("actions" in actionDef)
		{
			actionArray = getActionArray(actionDef.actions);
			isSync = !!actionDef.sync;
		}
		else
		{
			actionArray = getActionArray(actionDef);
		}

		if (!(actionArray instanceof Array))
		{
			console.error("Action Array wasn't an array. Aborting");
			return;
		}

		if (actionArray.length == 0)
		{
			console.error("Action array is empty!");
			return;
		}

		//Convert any offsets


		if (isSync)
		{
			//Push to the queue
			let release = await this.queueMutex.acquire();
			for (let action of actionArray)
			{
				this.queue.push(action);
			}
			release();

			this._runStartOfQueue();
		}
		else
		{
			this._runActions(actionArray);
		}
	}

	trigger(name, options)
	{
		let event = this.triggers[name];

		if (!event)
		{
			return false;
		}

		if ("number" in options)
		{
			console.log(`Fired ${name} : ${options.number}`)
			//Handle a numberlike event action
			let selected = null;
			for (let key in event)
			{
				let keyNumber = Number(key);
				if (isNaN(keyNumber))
					continue;
				if (options.number >= keyNumber)
					selected = event[key];
			}
			if (selected && isActionable(selected))
			{
				this.pushToQueue(selected, options);
				return true;
			}
			else if (selected)
			{
				console.error("Selected wasn't actionable.");
			}
		}
		else if ("name" in options)
		{
			console.log(`Fired ${name} : ${options.name}`)
			//Handle a namelike event
			let namedEvent = event[options.name];
			if (namedEvent && isActionable(namedEvent))
			{
				this.pushToQueue(namedEvent, options);
				return true;
			}
		}
		if (isActionable(event))
		{
			console.log(`Fired ${name}`)
			this.pushToQueue(event, options);
			return true;
		}
	}


	async _runActions(actionArray)
	{
		for (let action of actionArray)
		{
			await this._runAction(action);
		}
	}


	async _runAction(action)
	{
		//Hardcoded wait
		if (action.beforeDelay)
		{
			await sleep(action.beforeDelay * 1000);
		}

		for (let subAction in action)
		{
			if (subAction in this.actions)
			{
				this.actions[subAction].handler(action[subAction]);
			}
		}

		if (action.delay)
		{
			await sleep(action.delay * 1000);
		}
	}

	async _runNext()
	{
		if (this.queue.length > 0)
		{
			let release = await this.queueMutex.acquire();
			let front = this.queue.shift();
			let frontPromise = this._runAction(front);
			this.currentAction = frontPromise;
			this.currentAction.then(() => this._runNext());
			release();
		}
		else
		{
			this.currentAction = null;
		}
	}

	async _runStartOfQueue()
	{
		if (this.currentAction)
			return;

		if (this.queue.length == 0)
			return;

		console.log("Starting new chain");
		let release = await this.queueMutex.acquire();
		let front = this.queue.shift();
		let frontPromise = this._runAction(front);
		this.currentAction = frontPromise;
		this.currentAction.then(() => this._runNext());
		release();
	}
}

module.exports = { ActionQueue }