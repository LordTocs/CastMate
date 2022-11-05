import { Resource } from "../resources/resource";
import { ipcFunc } from "../utils/electronBridge";
import { Overlay } from "./overlay";


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

        webServices.routes.get(`overlays/:id`, (req, res, next) => {
            const overlay = this.overlayResources.getById(req.params.id);
            if (!overlay) {
                const error = new Error("Unknown Overlay");
                error.status = 404;
                return next(error);
            }

            return res.send(overlay.config);
        })
    }
}