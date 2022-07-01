const logger = require('../utils/logger');

class NumberTriggerHandler {
	constructor(triggerName, numberKey) {
		this.name = triggerName;
		this.numberKey = numberKey;
	}

	handle(queue, automationTable, data) {
		const numberValue = data[this.numberKey];

		if (!numberValue) {
			logger.info(`Attempted command action with no number key (${this.numberKey})`);
			return;
		}

		let automations = null;
		//Search the automation table for the maximum bound command under the numberValue;
		for (let key in automationTable) {
			let keyNumber = Number(key);
			if (isNaN(keyNumber))
				continue;
			if (numberValue >= keyNumber)
				automations = automationTable[key];
		}

		if (automations) {
			logger.info(`Triggered ${this.name} Number ${numberValue}`);
			for (let automation of automations) {
				logger.info(` - ${automation.automation}`);
			}
			queue.startAutomationArray(automations.map(a => a.automation), data);
			return true;
		}
	}
}

module.exports = { NumberTriggerHandler }