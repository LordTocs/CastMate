import { RPCWebSocket } from './rpc-websocket';
import EventEmitter from 'events'

export class CastMateBridge extends EventEmitter
{
	constructor(overlayId) 
	{
		super()
		this.overlayId = overlayId
        this.socket = null;

	}
	
	async acquireState(pluginName, stateName) {
		try {
			return await this.rpcSocket.call('acquireState', pluginName, stateName)
		}
		catch(err) {
			return null
		}
	}

	async freeState(pluginName, stateName) {
		try {
			return await this.rpcSocket.call('freeState', pluginName, stateName)
		}
		catch(err) {
			return null
		}
	}

	async call(funcName, ...args) {
		console.log("Calling", funcName, ":", ...args)
		return await this.rpcSocket.call(funcName, ...args)
	}

	connect()
	{ 
		this.socket = new WebSocket(`ws://${window.location.host}?overlay=${this.overlayId}`);

        this.rpcSocket = new RPCWebSocket(this.socket);

        this.rpcSocket.handle("setConfig", async (newConfig) => {
            this.emit('configChanged', newConfig)
        })

		this.rpcSocket.handle('widgetFunc', async (widgetId, funcName, ...args) => {
			this.emit('widgetFunc', widgetId, funcName, ...args);
		})

		this.rpcSocket.handle('widgetBroadcast', async (funcName, ...args) => {
			this.emit('widgetBroadcast', funcName, ...args);
		})

		this.rpcSocket.handle('stateUpdate', (pluginName, stateName, value) => {
			this.emit('stateUpdate', pluginName, stateName, value);
		})

		this.socket.addEventListener('open', () =>
		{
			console.log("Connected");
			this.emit("connected", null);
		});

		this.socket.addEventListener('close', () =>
		{
			setTimeout(() =>
			{
				console.log("Connection Closed: Attempting Reconnect");
				this.socket = null;
                this.rpcSocket = null;
				this.connect();
			}, 1000);
		});

		this.socket.addEventListener('error', (err) => {
			this.socket.close(); //Use close here instead so there's not a double reconnect.
		});
	}
}