import { Client } from 'tplink-smarthome-api'
import { IoTProvider, Light, Plug } from '../iot/iot-manager';
import { reactify } from '../state/reactive';

import { sleep } from '../utils/sleep';

class TPLinkBulb extends Light {
    constructor(light, powerState, lightState) {
        super()
        this.light = light
        this.id = light.id
        this.config = {
            name: light.alias,
            plugin: 'tplink',
            rgb: { available: light.supportsColor },
            kelvin: { available: light.supportsColorTemperature },
            dimming: { available: light.supportsBrightness },
        }
    }
}

class TPLinkPlug extends Plug {
    constructor(plug, powerState) {
        super()
        this.plug = plug
        this.id = plug.id

        this.config = {
            name: plug.alias,
            plugin: 'tplink',
        }

        this.state = reactify({
            on: powerState
        })
    }

    async setPlugState(on) {
        if (on === "toggle") {
            await this.plug.togglePowerState()
        }
        else {
            await this.plug.setPowerState(on)
        }
    }
}

class TPLinkIoTProvider extends IoTProvider {

    constructor(pluginObj) {
        super()
        this.pluginObj = pluginObj
        this.client = new Client({
            /*logger: {
                debug: (...args) => console.log(...args),
                info: (...args) => console.log(...args),
                warn: (...args) => console.log(...args),
                error: (...args) => console.log(...args),
            }*/
        })
        this.client.on('plug-new', async (plug) => {
            console.log("NEW TPLINK PLUG")
            this._addNewPlug(new TPLinkPlug(plug, await plug.getPowerState()))
        })

        this.client.on('bulb-new', async (light) => {
            await light.getInfo()
            this._addNewLight(new TPLinkBulb(light, await plug.getPowerState()))
        })

        this.client.on("error", async (err) => {
            console.error("TP-Link Error", err)
        })
    }

    async initServices() {
        console.log("Starting TP-Link Discovery...")
        this.client.startDiscovery({
            breakoutChildren: true
        })
    }

    async loadPlugs() {
        return []
    }

    async loadLights() {
        return []
    }
}

export default {
    name: "tplink",
	uiName: "Kasa tp-link",
	icon: "mdi-lightbulb-on-outline",
	color: "#7F743F",
    async init() {
        this.iotProvider = new TPLinkIoTProvider(this)
    },
    ipcMethods: {
        doDiscovery() {

        }
    }
}