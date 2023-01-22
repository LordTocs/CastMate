import { FileResource } from "../resources/resource.js";
import { PluginManager } from "../utils/plugin-manager.js";
import { Watcher } from "../state/reactive.js";
import { templateSchema } from "../state/template.js";
import { OverlayManager } from "./overlay-manager.js";
import { StateManager } from "../state/state-manager.js";
export class Overlay extends FileResource
{
    static storageFolder = "overlays/" 

    async getTemplatedConfig() {
        const result = {
            name: this.config.name,
            width: this.config.width,
            height: this.config.height,
            widgets: [...this.config.widgets]
        }

        const overlayManager = OverlayManager.getInstance();

        result.widgets = await Promise.all(result.widgets.map(async w => ({
            id: w.id,
            type: w.type,
            name: w.name,
            size: w.size,
            position: w.position,
            props: await templateSchema(w.props, overlayManager.getWidgetType(w.type)?.props, StateManager.getInstance().getTemplateContext({}))
        })))

        return result;
    }

    async resetWatcher() {
        if (this.configWatch) {
            this.configWatch.unsubscribe();
        }
        //Set up a watcher to automatically rebroadcast the state.
        this.configWatch = await Watcher.watchAsync(async () => {
            //Send over the websocket....
            const config = await this.getTemplatedConfig()
            await OverlayManager.getInstance().broadcastConfigChange(this.id, config)
        })
    }

    async setConfig(config) {
        super.setConfig(config);

       await this.resetWatcher();
    }

    async onLoaded() {
        await this.resetWatcher();
    }
}