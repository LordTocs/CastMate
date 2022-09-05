<template>
    <component :is="dynamicComponent" v-bind="widgetConfig.props ? widgetConfig.props : {}"></component>
</template>

<script>
import { defineAsyncComponent } from 'vue';

export default {
    props: {
        widgetConfig: {},
    },
    computed: {
        dynamicComponent() {
            //TODO: How does this resolve over http???
            return defineAsyncComponent(() => import(`../widgets/${this.widgetConfig.type}.vue`))
        }
    }
}
</script>