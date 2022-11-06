import { Resource } from "../resources/resource";
import { app, ipcFunc } from "../utils/electronBridge";
import { Overlay } from "./overlay";
import express from "express"
import httpProxy from "http-proxy"
import bodyParser from "body-parser"

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
    }

    async init(webServices) {
        await this.overlayResources.load();

        const overlayRoutes = express.Router();

        overlayRoutes.get(`/:id/config`, (req, res, next) => {
            const overlay = this.overlayResources.getById(req.params.id);
            if (!overlay) {
                const error = new Error("Unknown Overlay");
                error.status = 404;
                return next(error);
            }

            return res.send(overlay.config);
        })

        if (app.isPackaged)
        {
            //Serve static here!
        }
        else {
            const devProxy = httpProxy.createProxyServer({
                target: 'http://localhost:5174',
            })

            overlayRoutes.get(`/:id`, (req, res, next) => {
                console.log("Checking Overlay", req.params.id)
                const overlay = this.overlayResources.getById(req.params.id);
                if (!overlay) {
                    return next();
                }
                console.log("Proxying overlay.html");
                //Serve overlay.html
                devProxy.web(req, res, { ignorePath: true, target: 'http://localhost:5174/overlays/overlay.html' })
            })   

            overlayRoutes.get('*', (req, res, next) => {
                //Try to get the file from the dev server
                console.log("Proxying Other")
                devProxy.web(req, res, { }, (err) => {
                    console.log("Proxy failed!")
                    next(err)
                })
            });


        }
        
        webServices.app.use('/overlays/', overlayRoutes);
    }
}