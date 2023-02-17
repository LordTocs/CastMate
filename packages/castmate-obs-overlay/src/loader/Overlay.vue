<template>
    <template v-if="config">
        <widget-loader 
            v-for="widgetConfig in config.widgets" 
            :key="widgetConfig.id" 
            :widgetConfig="widgetConfig" 
            ref="widgets" 
        />
    </template>
</template>

<script>
import WidgetLoader from './WidgetLoader.vue'
import { CastMateBridge } from './utils/websocket.js'
import axios from 'axios'
import { StateProvider } from './utils/castmate-state'

export default {
    components: { WidgetLoader },
    beforeCreate() {
        console.log("Creating State Provider")
        this.stateProvider = new StateProvider()

        const overlayId = window.location.href.substring(window.location.href.lastIndexOf('/') + 1); //Probably includes querystring????
        this.bridge = new CastMateBridge(overlayId);
    },
    data() {
        return {
            config: null,
            rootState: {}
        }
    },
    methods: {

    },
    provide() {
        console.log("Providing!", this.stateProvider)
        return {
            isEditor: false,
            mediaFolder: { value: `http://${window.location.host}/media/`},
            stateProvider: this.stateProvider,
            bridge: this.bridge
        }
    },
    async mounted() {
        const overlayId = window.location.href.substring(window.location.href.lastIndexOf('/') + 1); //Probably includes querystring????
        // Connect to the websocket
        this.stateProvider.init(this.rootState, this.bridge)

        this.bridge.on('configChanged', (newConfig) => this.config = newConfig);

        this.bridge.on('widgetFunc', async (widgetId, funcName, ...args) => {
            const widget = this.$refs.widgets.find(w => w.$props.widgetConfig.id == widgetId);
            console.log(this.$refs.widgets[0]?.$props)

            if (!widget) {
                console.log("UNKNOWN WIDGET", widgetId)
                return
            }

            widget.callWidgetFunc(funcName, ...args);
        })

        this.bridge.on('widgetBroadcast', async (funcName, ...args) => {
            for (let widget of this.$refs.widgets) {
                widget.callWidgetBroadcast(funcName, ...args);
            }
        })

        this.bridge.connect();
        
        try {
            const configResp = await axios.get(`/overlays/${overlayId}/config`)
            // Load the config
            this.config = configResp.data; 
        }
        catch(err) {
            //PaNiC!
        }
    }
}
</script>

<style>
body {
    margin: 0
}
</style>