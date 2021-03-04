
const { template } = require('../utils/template');
const _ = require('lodash');
module.exports = {
	name: "websocket",
	async onWebsocketMessage(msg, connection)
	{
		//Broadcast state out over the websocket.
		if ("state" in msg)
		{
			let result = {};
			for (let stateKey of msg.state)
			{
				if (stateKey in this.plugins.combinedState)
				{
					result[stateKey] = this.plugins.combinedState[stateKey];
				}
			}
			connection.send(JSON.stringify({ state: result }));
		}
	},
	methods: {
		transformTemplatesRecursive(obj, context)
		{
			if (obj instanceof Object)
			{
				for (let key in obj)
				{
					let value = obj[key];
					if (typeof value == 'string' || value instanceof String)
					{
						obj[key] = template(value, context);
					}
					else if (value instanceof Object || value instanceof Array)
					{
						this.transformTemplatesRecursive(value, context);
					}
				}
			}
			else if (obj instanceof Array)
			{
				for (let i = 0; i < obj.length; ++i)
				{
					let value = obj[i];
					if (typeof value == 'string' || value instanceof String)
					{
						obj[i] = template(obj[i], data);
					}
					else if (value instanceof Object || value instanceof Array)
					{
						this.transformTemplatesRecursive(value, context);
					}
				}
			}
		}
	},
	actions: {
		websocket: {
			name: "Websocket Broadcast",
			async handler(websocketData, context) {

				let data = _.cloneDeep(websocketData);

				this.transformTemplatesRecursive(data, context);

				await this.webServices.websocketServer.broadcast(JSON.stringify(data));
			}
		}
	}
}