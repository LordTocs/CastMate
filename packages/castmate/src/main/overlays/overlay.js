import { FileResource } from "../resources/resource.js";
import { OverlayManager } from "./overlay-manager.js";
export class Overlay extends FileResource
{
    static storageFolder = "overlays/" 

    async setConfig(config) {
        super.setConfig(config);
        //Send over the websocket....
        await OverlayManager.getInstance().broadcastConfigChange(this.id, config)
    }
}