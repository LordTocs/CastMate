<template>
    <component :is="dynamicComponent" v-bind="widgetConfig.props ? widgetConfig.props : {}" class="widget" :style="widgetStyle" > </component>
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
        },
        widgetStyle() {
            return {
                left: `${this.widgetConfig?.position.x}px`,
                top: `${this.widgetConfig?.position.y}px`,
                width: `${this.widgetConfig?.size.width}px`,
                height: `${this.widgetConfig?.size.height}px`,
            }
        }
    }
}
</script>

<style scoped>
.widget {
    position: absolute;
}
</style>