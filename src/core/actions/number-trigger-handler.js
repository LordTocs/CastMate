const logger = require('../utils/logger');

class NumberTriggerHandler
{
	constructor(triggerName, numberKey)
	{
		this.name = triggerName;
		this.numberKey = numberKey;
	}

	handle(queue, automationTable, data)
	{
		const numberValue = data[this.numberKey];

		if (!numberValue)
		{
			logger.info(`Attempted command action with no number key (${this.numberKey})`);
			return;
		}

		let automation = null;
		//Search the automation table for the maximum bound command under the numberValue;
		for (let key in automationTable)
		{
			let keyNumber = Number(key);
			if (isNaN(keyNumber))
				continue;
			if (numberValue >= keyNumber)
				automation = automationTable[key];
		}

		if (automation)
		{
			logger.info(`Triggered ${this.name} Number ${numberValue} - ${automation.auttomation}`);
			queue.startAutomation(automation.automation, data);
			return true;
		}
	}
}

module.exports = { NumberTriggerHandler }