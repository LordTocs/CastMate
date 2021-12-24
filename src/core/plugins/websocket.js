
const { template } = require('../utils/template');
const _ = require('lodash');
module.exports = {
	name: "websocket",
	uiName: "Websocket",
	icon: "mdi-code-json",
	color: "#CE9E77",
	async onWebsocketMessage(msg, connection)
	{
		//Broadcast state out over the websocket.
		if ("state" in msg)
		{
			let result = {};
			for (let stateKey of msg.state)
			{

				if (this.plugins.stateLookup[stateKey.plugin] && (stateKey.state in this.plugins.stateLookup[stateKey.plugin]))
				{
					if (!(stateKey.plugin in result))
					{
						result[stateKey.plugin] = {};
					}

					result[stateKey.plugin][stateKey.state] = this.plugins.stateLookup[stateKey.plugin][stateKey.state];
				}
			}
			connection.send(JSON.stringify({ state: result }));
		}
	},
	methods: {
		async transformTemplatesRecursive(obj, context)
		{
			if (obj instanceof Object)
			{
				for (let key in obj)
				{
					let value = obj[key];
					if (typeof value == 'string' || value instanceof String)
					{
						obj[key] = await template(value, context);
					}
					else if (value instanceof Object || value instanceof Array)
					{
						await this.transformTemplatesRecursive(value, context);
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
						obj[i] = await template(obj[i], context);
					}
					else if (value instanceof Object || value instanceof Array)
					{
						await this.transformTemplatesRecursive(value, context);
					}
				}
			}
		}
	},
	actions: {
		websocket: {
			name: "Websocket Broadcast",
			icon: "mdi-code-json",
			color: "#CE9E77",
			data: {
				type: Object
			},
			async handler(websocketData, context)
			{

				let data = _.cloneDeep(websocketData);

				await this.transformTemplatesRecursive(data, context);

				await this.webServices.websocketServer.broadcast(JSON.stringify(data));
			}
		}
	}
}