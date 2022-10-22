<template>
    <component :is="dynamicComponent" v-bind="widgetConfig.props ? widgetConfig.props : {}"> </component>
</template>

<script>
import loadWidget from 'castmate-overlay-components';

export default {
    props: {
        widgetConfig: {},
    },
    computed: {
        dynamicComponent() {
            console.log("WidgetConfig: ", this.widgetConfig)
            //TODO: How does this resolve over http???
            console.log("Loading: ", this.widgetConfig.type)
            return loadWidget(this.widgetConfig.type)
        }
    }
}
</script>