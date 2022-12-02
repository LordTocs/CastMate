<template>
    <component :is="dynamicComponent" v-bind="widgetConfig.props ? widgetConfig.props : {}" :isEditor="true"> </component>
</template>

<script>
import loadWidget from 'castmate-overlay-components';
import { defineAsyncComponent } from 'vue';

export default {
    props: {
        widgetConfig: {},
    },
    computed: {
        dynamicComponent() {
            const component = defineAsyncComponent({
                loader: async () => {
                    const widget = await loadWidget(this.widgetConfig.type)
                    return widget
                }
            })
            
            return component
        }
    }
}
</script>