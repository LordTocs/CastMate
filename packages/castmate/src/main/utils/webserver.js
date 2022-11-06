import express from "express"
import bodyParser from "body-parser"
import websocket from "websocket"
import ws from "ws"
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

	let server = http.createServer(app)

	app.use("/plugins/", routes);

	const wsServer = new ws.Server({ noServer: true });

	wsServer.on('connection', async (socket, request) => {
		console.log("Connected Socket");

		socket.on("message", (rawData, isBinary) => {
			if (isBinary)
				return;
			let data = null;
			try {
				data = JSON.parse(rawData);
			}
			catch(err) {
				return;
			}

			for (let plugin of plugins.plugins) {
				if (plugin.onWebsocketMessage) {
					plugin.onWebsocketMessage(data, socket);
				}
			}
		})

		for (let plugin of plugins.plugins) {
			if (plugin.onWebsocketConnected) {
				plugin.onWebsocketConnected(socket);
			}
		}
	});

	const wsProxies = {};
	
	let port = settings.port || 80;

	const result = {
		app,
		routes,
		wsProxies,
		websocketServer: wsServer,
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
			server.on('upgrade', async (request, socket, head) => {
				//Check if this route is proxied
				const url = new URL(request.url, `http://${request.headers.host}`)
		
				const proxy = wsProxies[url.pathname]; 
				if (proxy)
				{
					proxy.ws(request, socket, head)
					return;
				}
		
				//Non-proxied ws connection
				//Upgrade it to a websocket connection here
				wsServer.handleUpgrade(request, socket, head, (socket) => {
					server.emit('connection', socket, request)
				})
			});
		},
		updatePort: (newPort) => {
			server.close(() => {
				result.port = newPort;

				server.listen(newPort, () => {
					logger.info(`Started Internal Webserver on port ${newPort}`);
				})
			})
		},
		stop: () => {
			server.close();
		}
	}
	return result;
}
