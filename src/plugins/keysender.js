const KS = require('node-key-sender'); // For more info: https://www.npmjs.com/package/node-key-sender

module.exports = {
	name: "nodekeysender",
	async init()
	{

    },
	methods: {
	},
	settings: {
	},
	secrets: {
	},
	state: {
	},
	actions: {
        pressKey: {
            name: "Press Key",
            description: "Presses a selected keyboard key.",
            handler(key, context)
			{
                
                KS.sendKey(key, context);
			}
        }
	}
}