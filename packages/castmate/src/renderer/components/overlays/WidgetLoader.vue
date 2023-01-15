<template>
    <component :is="dynamicComponent" v-bind="widgetProps" :isEditor="true" />
</template>

<script setup>
import loadWidget from 'castmate-overlay-components';
import { computed, defineAsyncComponent, ref } from 'vue';
import { useTemplatedData } from '../../utils/templates';
import { cleanVuePropSchema } from '../../utils/vueSchemaUtils';

const props = defineProps({
    widgetConfig: {}
})

const propSchema = ref(null)

const untemplatedProps = computed(() => {
    console.log("Untemplated Props")
    return props.widgetConfig.props
})
const templatedProps = useTemplatedData(propSchema, untemplatedProps)

const widgetProps = computed(() => {
    if (!props.widgetConfig.props)
        return {}
    return templatedProps.value
})

const dynamicComponent = computed(() => {
    const component = defineAsyncComponent({
        loader: async () => {
            const widget = await loadWidget(props.widgetConfig.type)
            console.log("Widget Loaded!")
            propSchema.value = cleanVuePropSchema(widget.default.props)
            return widget
        }
    })
    
    return component
});

</script>