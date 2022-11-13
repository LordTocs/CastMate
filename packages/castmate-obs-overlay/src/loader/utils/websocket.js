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

	connect()
	{ 
		this.socket = new WebSocket(`ws://${window.location.host}?overlay=${this.overlayId}`);

        this.rpcSocket = new RPCWebSocket(this.socket);

        this.rpcSocket.handle("setConfig", async (newConfig) => {
            this.emit('configChanged', newConfig)
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