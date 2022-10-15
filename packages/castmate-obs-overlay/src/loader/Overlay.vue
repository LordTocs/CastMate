<template>
    <widget-loader v-for="widgetConfig in config" :key="widgetConfig.id" :widgetConfig="widgetConfig" />
</template>

<script>
import WidgetLoader from './WidgetLoader.vue'
import { CastMateBridge } from './utils/websocket.js'
export default {
    props: {
        overlayId: { type: String },
    },
    components: { WidgetLoader },
    data() {
        return {
            config: [],
            castmateState: {},
        }
    },
    methods: {

    },
    async mounted() {
        // Connect to the websocket
        this.bridge = new CastMateBridge(this.castmateState);
        
        // Load the config
        this.config = [{
            id: "a",
            type: "Label",
            props: {
                message: "Hello from config"
            }
        }]
    }
}
</script>