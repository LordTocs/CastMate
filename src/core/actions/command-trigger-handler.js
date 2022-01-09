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

		const automation = automationTable[key];
		
		if (automation)
		{
			logger.info(`Triggered ${this.name} Command ${key} - ${automation.automation}`);
			queue.startAutomation(automation.automation, data);
			return true;
		}
		else
		{
			logger.info(`Triggered ${this.name} Command ${key} - No Bound Automation`)
		}
	}
}

module.exports = { CommandTriggerHandler }