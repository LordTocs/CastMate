import { sleep } from "../utils/sleep.js"
import { Mutex } from "async-mutex"
import { reactiveCopy } from "../utils/reactive.js"
import logger from '../utils/logger.js'
import { ipcMain } from "../utils/electronBridge.js"
import _ from 'lodash'

/** 
 * automation:
 *   queue: "queue-id"
 *   actions:
 *    - id: "abc"
 *      plugin: "plugin"
 *      action: "action"
 *      data: { ... }
 *      timeline:
 *       - id: "def"
 *         offset: 10s.
 *         actions:
 * 		     - id: 'ghi'
 *             plugin: 'plugin'
 *             action: 'action'
 *             data:
 *   		   child:
 *               id:
 *               plugin:
 *               action:
 *               data:
 * 				 child:
 *        - id: 
 *          plugin:
 *          action:
 *          data:
 *          timeline:
 *   
 * 
 * 
*/



class QueuedAutomation {
	constructor(spec, triggerContext, queue) {
		this.spec = spec
		this.queue = queue
		this.triggerContext = triggerContext || {}
		this.context 
		this.startTime = null;
		this.abortController = new AbortController();
	}

	cancel() {
		this.abortController.abort();
	}

	async execute() {
		if (!this.spec?.actions)
			return false;

		const completeContext = this.system.getCompleteContext(this.triggerContext);

		await this.queue.system._executeActions(this.spec.actions, completeContext, this.abortController.signal);
	}
}

class Queue {
	constructor(name, system, autoRelease = true) {
		this.system = system;
		this.name = name;

		this.queue = [];
		this.queueMutex = new Mutex();

		this.history = [];
		this.autoRelease = autoRelease
		this.executing = null;
	}

	enqueue(automation, triggerContext) {
		const qa = new QueuedAction(automation, triggerContext);

		const mutexRelease = this.queueMutex.acquire();
		this.queue.push(qa);
		mutexRelease();

		if (this.autoRelease)
		{
			this.release();
		}

		return qa;
	}

	async release() {
		if (this.queue.length > 0) {
			let release = await this.queueMutex.acquire();
			let qa = this.queue.shift();
			let qaPromise = qa.execute();
			this.syncAutomationPromise = qaPromise;
			this.syncAutomationPromise.then(() => this._runNext());
			release();
		}
		else {
			this.syncAutomationPromise = null;
		}
	}
}

export class ActionSystem {

	constructor() {
		this.queuelessAbortController = new AbortController();
		this.queues = {};
		//TODO: Create queues from settings
	}

	/**
	 * @param {*} actions 
	 * @param {*} context 
	 * @param {Number} offset 
	 * @param {AbortSignal} abortSignal 
	 * @returns 
	 */
	_timelineOffset(actions, context, offset, abortSignal) {
		return new Promise((resolve, reject) => {
			const aborter = () => {
				clearTimeout(timeout);
				resolve();
			};
			const timeout = setTimeout(async () => {
				abortSignal.removeEventListener("abort", aborter);
				await this._executeActions(actions,context, abortSignal);
				resolve()
			}, offset * 1000)
			abortSignal.addEventListener('abort', aborter, {once: true});
		})
	}

	async _executeTimeline(timeline, context, abortSignal) {
		const promises = [];
		for (let timelineSpec of timeline) {
			promises.push(this._executeActionsOffset(timelineSpec.actions, context, timelineSpec.offset, abortSignal));
		}
		return await Promise.all(promises);
	}

	/**
	 * 
	 * @param {*} spec 
	 * @param {*} context 
	 * @param {AbortSignal} abortSignal 
	 */
	async _executeActionSpec(spec, context, abortSignal) {
		if (abortSignal.aborted)
			return;

		const actionType = this.getActionType(spec);

		let promises = [];
		
		if (actionType)
		{
			//TODO: Track active actions
			promises.push(actionType.execute(spec.data || {}, context, abortSignal).catch((err) => {
				logger.error(`Error Executing Action: ${spec.plugin}:${spec.action}`);
				logger.error(`    ${err}`);
			}))
		}
		else
		{
			logger.error(`Missing Action Type ${spec.plugin}:${spec.action}`);
		}


		if (spec.child)
		{
			promises.push(this._executeActionSpec(spec.child, context, abortSignal));
		}

		if (spec.timeline)
		{
			promises.push(this._executeTimeline(spec.timeline, context, abortSignal))
		}

		return await Promise.all(promises);
	}

	/**
	 * 
	 * @param {*} spec 
	 * @param {*} context 
	 * @param {AbortSignal} abortSignal 
	 */
	async _executeActions(spec, context, abortSignal) {
		for (let actionSpec of spec) {
			if (abortSignal.aborted)
				break;
			await this._executeActionSpec(actionSpec, context, abortSignal);
		}
	}

	getCompleteContext(triggerContext) {
		let completeContext = { ...triggerContext };
		_.merge(completeContext, this.plugins.templateFunctions);
		//merge won't work with reactive props, manually go deep here.
		for (let pluginKey in this.plugins.stateLookup) {
			if (!(pluginKey in completeContext)) {
				completeContext[pluginKey] = {};
			}
			reactiveCopy(completeContext[pluginKey], this.plugins.stateLookup[pluginKey]);
		}
		return completeContext;
	}

	enqueueAutomation(automation, triggerContext) {
		if (!automation.queue)
		{
			this._executeActions(automation.actions, this.getCompleteContext(triggerContext), this.queuelessAbortController.signal);
		}
		else
		{
			const queue = this.queues[automation.queue];
			if (!queue)
			{
				logger.error(`Undefined Queue: ${automation.queue}. Ignoring automation trigger`);
				return;
			}
			queue.enqueue(automation, triggerContext);	
		}
	}
}



export class ActionQueue {
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

				const pluginTrigger = plugin.triggers[triggerName];
				this.triggerHandlers[plugin.name][triggerName] = async (context, ...args) => {

					if (!this.triggerMappings[plugin.name])
					{
						logger.error(`Error missing trigger handlers for  ${plugin.name}`);
						return;
					}

					const mappings = this.triggerMappings[plugin.name][triggerName];
					if (!mappings)
					{
						logger.error(`Error missing trigger handlers for  ${plugin.name}-${triggerName}`);
						return;
					}

					const completeContext = this.createCompleteContext(context)

					for (let mapping of mappings) {
						try {
							if (!pluginTrigger.internalHandler || await pluginTrigger.internalHandler(mapping.config, completeContext, mapping, ...args)) {
								this._startAutomationInternal(mapping.automation, completeContext)
							}
						}
						catch (err) {
							logger.error(`Error in trigger Handler ${plugin.name}:${triggerName} - ${err}`);
						}
					}
				}
			}
		}

		this.plugins = plugins;

		const dummyContext = {
			//Some dummy data.
			user: "LordTocs",
			userColor: "#4411FF",
			userId: "27082158",
			message: "Thanks for using CastMate.",
			filteredMessage: "Thanks for using CastMate.",
		}

		ipcMain.handle('core_runActions', async (event, actions, context) => {
			const automation = { actions, sync: false };

			const completeContext = this.createCompleteContext(context || dummyContext);

			this.pushToQueue(automation, completeContext)
		})

		ipcMain.handle('core_runAutomation', async (event, automationName, context) => {
			
			this.startAutomation(automationName, this.createCompleteContext(context || dummyContext))
		})
	}

	setTriggers(triggers) {
		this.triggerMappings = triggers;
	}

	convertOffsets(actions) {
		let timeSinceStart = 0;

		for (let a of actions) {
			if (a.plugin == 'castmate' && a.action == "timestamp") {
				a.beforeDelay = a.data - timeSinceStart;
				timeSinceStart = a.data;
			}
		}
	}

	async _startAutomationInternal(automationObj, context) {
		let automation = null;
		if (typeof automationObj == 'string' || automationObj instanceof String) {
			automation = this.automations.get(automationObj);

			if (!automation) {
				logger.error(`Missing Automation: ${automationName}`);
				return;
			}
		}
		else {
			automation = automationObj;
			//TODO: Validate automation object here.

			if (!automation) {
				logger.error(`Invalid automation object!`);
				return;
			}
		}

		this.pushToQueue(automation, context);
	}

	async startAutomation(automation, context) {
		return this._startAutomationInternal(automation, this.createCompleteContext(context))
	}

	async startAutomationArray(automations, context) {
		for (let automation of automations) {
			this.startAutomation(automation, context);
		}
	}

	_prepAutomation(automation) {
		if (!automation) {
			logger.error("Automation missing!");
		}

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

	createCompleteContext(context) {
		let completeContext = { ...context };
		_.merge(completeContext, this.plugins.templateFunctions);
		//merge won't work with reactive props, manually go deep here.
		for (let pluginKey in this.plugins.stateLookup) {
			if (!(pluginKey in completeContext)) {
				completeContext[pluginKey] = {};
			}
			reactiveCopy(completeContext[pluginKey], this.plugins.stateLookup[pluginKey]);
		}
		return completeContext;
	}

	async pushToQueue(automation, context) {
		//Build our complete context.
		
		this._prepAutomation(automation);

		if (automation.sync) {
			//Push to the queue
			let release = await this.queueMutex.acquire();
			this.queue.push({ automation, context });
			release();

			this._runStartOfQueue();
		}
		else {
			this._runAutomation(automation, context);
		}
	}

	trigger(plugin, name, context, ...args) {
		const pluginHandlers = this.triggerHandlers[plugin];

		if (!pluginHandlers) {
			return false;
		}

		let triggerHandler = this.triggerHandlers[plugin][name];

		if (!triggerHandler) {
			return false;
		}

		return triggerHandler(context, ...args);
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
					console.error(`${action.plugin}${action.action} threw Exception!`);
					console.error(reason);
				});
			}
		}

		if (action.plugin === "castmate") {
			if (action.action === "automation") {
				const subAutomationName = action.data.automation;
				const subAutomation = this.automations.get(subAutomationName);
				this._prepAutomation(subAutomation);
				await this._runAutomation(subAutomation);
			}

			if (action.action === "delay") {
				await sleep(action.data * 1000);
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
