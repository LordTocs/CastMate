const express = require("express");
const bodyParser = require("body-parser");
const websocket = require("websocket");
const http = require("http");

function createWebServices(settings, secrets)
{
	let app = express();
	let routes = express.Router();

	// Parse application/x-www-form-urlencoded
	routes.use(bodyParser.urlencoded({ extended: false }));

	// Parse application/json
	routes.use(bodyParser.json());
	routes.use(express.json());

	let server = http.createServer(app);
	let port = settings.port || 80;
	server.listen(port, () =>
	{
		console.log(`Started Internal Webserver on port ${port}`);
		app.use(express.static("./web"));
	});

	let websocketServer = new websocket.server({
		httpServer: server,
		autoAcceptConnections: true
	});

	return {
		app,
		routes,
		websocketServer,
		hostname: secrets.hostname,
		port: settings.port
	}
}

module.exports = { createWebServices };


