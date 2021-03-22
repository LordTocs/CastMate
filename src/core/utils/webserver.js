const express = require("express");
const bodyParser = require("body-parser");
const websocket = require("websocket");
const http = require("http");

function createWebServices(settings, secrets, plugins)
{
	let app = express();
	let routes = express.Router();

	// Parse application/x-www-form-urlencoded
	routes.use(bodyParser.urlencoded({ extended: false }));

	// Parse application/json
	routes.use(bodyParser.json());
	routes.use(express.json());

	let server = http.createServer(app);

	app.use("/plugins/", routes);

	let websocketServer = new websocket.server();

	websocketServer.on('connect', function (connection)
	{
		connection.on('message', function (data)
		{
			if (data.utf8Data)
			{
				let msg = JSON.parse(data.utf8Data);

				for (let plugin of plugins.plugins)
				{
					if (plugin.onWebsocketMessage)
					{
						plugin.onWebsocketMessage(msg, connection);
					}
				}
			}
		});

		connection.on('close', function ()
		{
		});
	});

	return {
		app,
		routes,
		websocketServer,
		hostname: secrets.hostname,
		port: settings.port,
		start: () =>
		{
			let port = settings.port || 80;
			server.listen(port, () =>
			{
				console.log(`Started Internal Webserver on port ${port}`);
				app.use(express.static("./web"));
			});
		},
		startWebsockets: () =>
		{
			websocketServer.mount({
				httpServer: server,
				autoAcceptConnections: true
			});
		}
	}
}

module.exports = { createWebServices };


