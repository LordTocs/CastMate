import { Resource } from "../resources/resource";
import { app, ipcFunc } from "../utils/electronBridge";
import { Overlay } from "./overlay";
import express from "express"
import httpProxy from "http-proxy"
import { RPCWebSocket } from '../utils/rpc-websocket.js'
import { nanoid } from "nanoid/non-secure";
import logger from "../utils/logger";

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

    async init(webServices) {
        await this.overlayResources.load();

        const overlayRoutes = express.Router();

        overlayRoutes.get(`/:id/config`, async (req, res, next) => {
            const overlay = this.overlayResources.getById(req.params.id);
            if (!overlay) {
                const error = new Error("Unknown Overlay");
                error.status = 404;
                return next(error);
            }

            return res.send(await overlay.getTemplatedConfig());
        })

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

        
        webServices.on('ws-connection', (socket, params) => {
            if (params.get('overlay'))
            {
                logger.info("Overlay Connection: ");
                const newSocket = {
                    id: nanoid(),
                    socket: new RPCWebSocket(socket),
                    overlayId: params.get('overlay'),
                }

                socket.on('close', () => {
                    const idx = this.openSockets.findIndex(s => s.id == newSocket.id)
                    if (idx == -1) return;
                    console.log("Closing Overlay Connection", newSocket.id)
                    this.openSockets.splice(idx, 1);
                })

                this.openSockets.push(newSocket);
            }
        })
    }

    async broadcastConfigChange(overlayId, newConfig) {
        //console.log("Broadcasting UPDATE", overlayId);
        await Promise.all(this.openSockets.filter((s) => s.overlayId == overlayId).map(
            async (s) => s.socket.call('setConfig', newConfig).catch(err => null)))
    }
}

