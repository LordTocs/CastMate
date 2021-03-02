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
			variables: [...names]
		}))
	}

	connect()
	{
		this.socket = new WebSocket("ws://127.0.0.1:81");

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
				console.log("Attempting Reconnect");
				this.connect();
			}, 1000);
		});

		this.socket.addEventListener('error', (err) => {
			setTimeout(() =>
			{
				console.log("Attempting Reconnect");
				this.connect();
			}, 1000);
		});
	}
}


const castmate = new CastMateBridge();