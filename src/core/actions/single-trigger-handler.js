const logger = require('../utils/logger');

class SingleTriggerHandler
{
	constructor(triggerName)
	{
		this.name = triggerName;
	}

	handle(queue, automationTable, data)
	{
		queue.startAutomationArray(automationTable.map(a => a.automation), data);
		return true;
	}
}

module.exports = { SingleTriggerHandler }