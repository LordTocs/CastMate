class CastMateBridge
{
	constructor() 
	{
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

	requestVariables(...names)
	{
		this.socket.send(JSON.stringify({
			state: [...names]
		}))
	}

	connect()
	{
		// TODO: This address needs to be dynamic!
		this.socket = new WebSocket(`ws://${window.location.host}`);

		this.socket.addEventListener('message', (event) =>
		{
			let msg = JSON.parse(event.data);

			for (let event in msg)
			{
				this.emit(event, msg[event]);
			}
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
				this.connect();
			}, 1000);
		});

		this.socket.addEventListener('error', (err) => {
			this.socket.close(); //Use close here instead so there's not a double reconnect.
		});
	}
}


const castmate = new CastMateBridge();