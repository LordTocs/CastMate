import ws from 'ws'
import { RPCWebSocket } from './rpc-websocket';

export class CastMateBridge
{
	constructor(stateObj) 
	{
        this.socket = null;
        this.stateObj = stateObj;
		this.callbacks = {};
	}

	on(event, func)
	{
		if (event in this.callbacks)
		{
			this.callbacks[event].push(func);
		}
		else
		{
			this.callbacks[event] = [func];
		}
	}

	emit(event, payload)
	{
		if (event in this.callbacks)
		{
			for (let func of this.callbacks[event])
			{
				try
				{
					func(payload);
				}
				catch (err)
				{
					console.error(err);
				}
			}
		}
	}

	connect()
	{
		// TODO: This address needs to be dynamic!
		this.socket = new ws.Websocket(`ws://${window.location.host}`);
        this.rpcSocket = new RPCWebSocket(this.socket);

        this.rpcSocket.handle("stateUpdate", async (updateObj) => {
            Object.assign(this.stateObj, updateObj);
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