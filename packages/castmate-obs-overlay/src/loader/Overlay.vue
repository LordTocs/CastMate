<template>
    <template v-if="config">
        <widget-loader v-for="widgetConfig in config.widgets" :key="widgetConfig.id" :widgetConfig="widgetConfig" />
    </template>
</template>

<script>
import WidgetLoader from './WidgetLoader.vue'
import { CastMateBridge } from './utils/websocket.js'
import axios from 'axios'

export default {
    components: { WidgetLoader },
    data() {
        return {
            config: null,
        }
    },
    methods: {

    },
    async mounted() {
        // Connect to the websocket
        const overlayId = window.location.href.substring(window.location.href.lastIndexOf('/') + 1); //Probably includes querystring????

        this.bridge = new CastMateBridge(overlayId);

        this.bridge.on('configChanged', (newConfig) => this.config = newConfig);

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