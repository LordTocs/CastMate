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
            return loadWidget(this.widgetConfig.type)
        }
    }
}
</script>