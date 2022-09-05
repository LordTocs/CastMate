<template>
    <component :is="dynamicComponent" v-bind="widgetConfig.props ? widgetConfig.props : {}"></component>
</template>

<script>
import loadWidget from '../widgets/widgetLoader';

export default {
    props: {
        widgetConfig: {},
    },
    computed: {
        dynamicComponent() {
            //TODO: How does this resolve over http???
            return loadWidget(this.widgetConfig.type)
        }
    }
}
</script>