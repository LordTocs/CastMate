import { Resource } from "../resources/resource";
import { app, ipcFunc } from "../utils/electronBridge";
import { Overlay } from "./overlay";
import express from "express"
import httpProxy from "http-proxy"
import { RPCWebSocket } from '../utils/rpc-websocket.js'
import { nanoid } from "nanoid/non-secure";
import logger from "../utils/logger";
import { WebServices } from "../webserver/webserver";
import { StateManager } from "../state/state-manager";
import { onStateChange } from "../state/reactive";

let overlayManager = null;



export class OverlayManager {

    constructor() {
        this.overlayResources = new Resource(Overlay, {
            type: "overlay",
            name: "Overlay",
            description: "Overlay",
            config: {
                type: Object,
                properties: {
                    name: { type: String },
                    width: { type: Number },
                    height: { type: Number },
                    widgets: { 
                        type: Array, 
                        items: { 
                            type: Object, 
                            properties: {
                                id: { type: String },
                                type: { type: String },
                                props: {
                                    type: Object,
                                },
                                position: {
                                    type: Object,
                                    properties: {
                                        x: { type: Number },
                                        y: { type: Number },
                                    }
                                },
                                size: {
                                    type: Object,
                                    properties: {
                                        width: { type: Number },
                                        height: { type: Number },
                                    }
                                }
                            }
                        },
                    }
                },
            }
        })
        this.openSockets = [];

        this.overlayTypes = {}

        ipcFunc("overlays","setTypes", (types) => {
            this.overlayTypes = types;

            console.log("Overlay Types Loaded, Resetting Watchers")
            //Reset any of the watchers now that we have the overlay types
            for (let overlay of this.overlayResources.resources) {
                overlay.resetWatcher();
            }
        })
    }

    getById(id) {
        return this.overlayResources.getById(id)
    }
    
    getWidgetType(id) {
        return this.overlayTypes?.[id];
    }

    async callOverlayFunc(overlayId, widgetId, funcName, ...args) {
        await Promise.all(this.openSockets.filter((s) => s.overlayId == overlayId).map(
            async (s) => s.socket.call('widgetFunc', widgetId, funcName, ...args).catch(err => null)))
    }

    async broadcastOverlayFunc(funcName, ...args) {
        await Promise.all(this.openSockets.map(async (s) => {
            try { await s.socket.call('widgetBroadcast', funcName, ...args) }
            catch(err) {}
        }))
    }

    /**
     * 
     * @returns {OverlayManager}
     */
    static getInstance() {
        if (!overlayManager)
        {
            overlayManager = new this();
        }
        return overlayManager;
    }

    async init() {
        await this.overlayResources.load();

        const overlayRoutes = express.Router();
        const stateManager = StateManager.getInstance();

        overlayRoutes.get(`/:id/config`, async (req, res, next) => {
            const overlay = this.overlayResources.getById(req.params.id);
            if (!overlay) {
                const error = new Error("Unknown Overlay");
                error.status = 404;
                return next(error);
            }

            return res.send(await overlay.getTemplatedConfig());
        })

        const webServices = WebServices.getInstance();

        if (app.isPackaged)
        {
            //Serve static here!
        }
        else {
            const devProxy = httpProxy.createProxyServer({
                target: 'http://localhost:5174',
            })

            webServices.wsProxies['/overlays/'] = devProxy

            overlayRoutes.get(`/:id`, (req, res, next) => {
                console.log("Checking Overlay", req.params.id)
                const overlay = this.overlayResources.getById(req.params.id);
                if (!overlay) {
                    return next();
                }
                //Serve overlay.html
                devProxy.web(req, res, { ignorePath: true, target: 'http://localhost:5174/overlays/overlay.html' })
            })   

            overlayRoutes.get('*', (req, res, next) => {
                //Try to get the file from the dev server
                devProxy.web(req, res, { }, (err) => {
                    next(err)
                });
            });
        }
        
        webServices.app.use('/overlays/', overlayRoutes);

        
        webServices.on('ws-connection',async (socket, params) => {
            if (params.get('overlay'))
            {
                logger.info("Overlay Connection: ");
                const newSocket = {
                    id: nanoid(),
                    socket: new RPCWebSocket(socket),
                    overlayId: params.get('overlay'),
                    stateWatchers: []
                }

                socket.on('close', () => {
                    const idx = this.openSockets.findIndex(s => s.id == newSocket.id)
                    if (idx == -1) return;
                    console.log("Closing Overlay Connection", newSocket.id)

                    for (let watcher of newSocket.stateWatchers) {
                        watcher.watcher.unsubscribe();
                    }

                    this.openSockets.splice(idx, 1);
                })

                this.openSockets.push(newSocket);

                newSocket.socket.handle('acquireState', (pluginName, stateName) => {
                    
                    if (newSocket.stateWatchers.find(w => w.pluginName == pluginName && w.stateName == stateName))
                        return stateManager.rootState[pluginName]?.[stateName]

                    const watcher = onStateChange(stateManager.rootState[pluginName], stateName, () => {
                        newSocket.socket.call('stateUpdate', pluginName, stateName, stateManager.rootState[pluginName][stateName])
                    })

                    newSocket.stateWatchers.push({ pluginName, stateName, watcher })

                    return stateManager.rootState[pluginName]?.[stateName];
                })


                //We've just connected, it might be a reconnected overlay. Resend our config incase it's stale.
                const overlay = this.overlayResources.getById(newSocket.overlayId)
                newSocket.socket.call('setConfig', await overlay?.getTemplatedConfig())
            }
        })
    }

    async broadcastConfigChange(overlayId, newConfig) {
        //console.log("Broadcasting UPDATE", overlayId);
        await Promise.all(this.openSockets.filter((s) => s.overlayId == overlayId).map(
            async (s) => s.socket.call('setConfig', newConfig).catch(err => null)))
    }
}

