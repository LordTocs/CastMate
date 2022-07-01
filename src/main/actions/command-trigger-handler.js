const logger = require('../utils/logger');

class CommandTriggerHandler
{
	constructor(triggerName, commandKey)
	{
		this.name = triggerName;
		this.commandKey = commandKey;
	}

	handle(queue, automationTable, data)
	{
		const key = data[this.commandKey];

		if (!key)
		{
			logger.info(`Attempted command action with no key (${this.commandKey})`);
			return;
		}

		const automations = automationTable[key];
		
		if (automations)
		{
			logger.info(`Triggered ${this.name} Command ${key}`);
			for (let automation of automations)
			{
				logger.info(`  - ${automation.automation}`);
			}
			queue.startAutomationArray(automations.map(a => a.automation), data);
			return true;
		}
		else
		{
			logger.info(`Triggered ${this.name} Command ${key} - No Bound Automation`)
		}
	}
}

module.exports = { CommandTriggerHandler }