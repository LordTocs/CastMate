import express from "express"
import bodyParser from "body-parser"
import ws from "ws"
import http from "http"
import { mediaFolder, userFolder } from "../utils/configuration.js"
import path from "path"
import logger from "../utils/logger.js"
import { EventEmitter } from "node:events"

import { PluginManager } from "../pluginCore/plugin-manager"
import { SettingsManager } from "../pluginCore/settings-manager"

let webServices = null;

export class WebServices extends EventEmitter
{
	/**
	 * 
	 * @returns {WebServices}
	 */
	static getInstance() {
		if (!webServices) {
			webServices = new WebServices();
		}

		return webServices
	}

	constructor() {
		super()
		this.wsProxies = {};
		this.port = SettingsManager.getInstance().settings?.castmate?.port || 85;

		this.app = express();
		this.routes = express.Router();

		// Parse application/x-www-form-urlencoded
		this.routes.use(bodyParser.urlencoded({ extended: false }));

		// Parse application/json
		this.routes.use(bodyParser.json());
		this.routes.use(express.json());
		
		this.server = http.createServer(this.app)

		this.app.use("/plugins/", this.routes);

		this.websocketServer = new ws.Server({ noServer: true });

		this.websocketServer.broadcast = (message) => {
			for (let client in this.websocketServer.clients) {
				client.send(message)
			}
		}

		this.websocketServer.on('connection', async (socket, request) => {
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

				const plugins = PluginManager.getInstance();
				for (let plugin of plugins.plugins) {
					if (plugin.onWebsocketMessage) {
						plugin.onWebsocketMessage(data, socket);
					}
				}
			})

			const requestUrl = new URL(request.url, `http://${request.headers.host}`);
			this.emit('ws-connection', socket, requestUrl.searchParams)

			const plugins = PluginManager.getInstance();

			for (let plugin of plugins.plugins) {
				if (plugin.onWebsocketConnected) {
					plugin.onWebsocketConnected(socket);
				}
			}
		});
	}

	start() {
		this.port = SettingsManager.getInstance().settings?.castmate?.port || 85;

		this.server.listen(this.port, () => {
			logger.info(`Started Internal Webserver on port ${this.port}`);
			this.app.use(express.static("./web"));
			this.app.use("/user", express.static(path.join(userFolder, "data"), {
				etag: false
			}));

			this.app.use("/media", express.static(mediaFolder, {
				etag: false
			}))
		});
	}

	startWebsockets() {
		this.server.on('upgrade', async (request, socket, head) => {
			//Check if this route is proxied
			const url = new URL(request.url, `http://${request.headers.host}`)
	
			const proxy = this.wsProxies[url.pathname]; 
			if (proxy)
			{
				proxy.ws(request, socket, head)
				return;
			}
	
			//Non-proxied ws connection
			//Upgrade it to a websocket connection here
			this.websocketServer.handleUpgrade(request, socket, head, (socket) => {
				this.websocketServer.emit('connection', socket, request)
			})
		});
	}

	updatePort(newPort) {
		this.server.close(() => {
			this.port = newPort;

			this.server.listen(newPort, () => {
				logger.info(`Started Internal Webserver on port ${newPort}`);
			})
		})
	}

	stop() {
		this.server.close();
	}
}
