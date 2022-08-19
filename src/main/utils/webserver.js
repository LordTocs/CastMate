import express from "express"
import bodyParser from "body-parser"
import websocket from "websocket"
import http from "http"
import { userFolder } from "./configuration.js"
import path from "path"
import logger from "./logger.js"

export async function createWebServices(settings, secrets, plugins) {
	
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

	websocketServer.on('connect', function (connection) {
		connection.on('message', function (data) {
			if (data.utf8Data) {
				let msg = JSON.parse(data.utf8Data);

				for (let plugin of plugins.plugins) {
					if (plugin.onWebsocketMessage) {
						plugin.onWebsocketMessage(msg, connection);
					}
				}
			}
		});

		for (let plugin of plugins.plugins) {
			if (plugin.onWebsocketConnected) {
				plugin.onWebsocketConnected(connection);
			}
		}

		connection.on('close', function () {
		});
	});

	let port = settings.port || 80;

	const result = {
		app,
		routes,
		websocketServer,
		port: port,
		start: () => {
			server.listen(port, () => {
				logger.info(`Started Internal Webserver on port ${port}`);
				app.use(express.static("./web"));
				app.use("/user", express.static(path.join(userFolder, "data"), {
					etag: false
				}));
			});
		},
		startWebsockets: () => {
			websocketServer.mount({
				httpServer: server,
				autoAcceptConnections: true
			});
		},
		updatePort: (newPort) => {
			server.close(() => {
				websocketServer.unmount()

				result.port = newPort;

				server.listen(newPort, () => {
					logger.info(`Started Internal Webserver on port ${newPort}`);
					websocketServer.mount({
						httpServer: server,
						autoAcceptConnections: true
					});
				})
			})
		},
		stop: () => {
			server.close();
		}
	}
	return result;
}
