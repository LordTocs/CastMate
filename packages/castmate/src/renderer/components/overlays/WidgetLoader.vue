<template>
	<component
		:is="dynamicComponent"
		v-bind="widgetProps"
		:size="widgetSize"
		:position="widgetPosition"
		:isEditor="true"
	/>
</template>

<script setup>
import loadWidget from "castmate-overlay-components"
import { computed, defineAsyncComponent, ref } from "vue"
import { useTemplatedData } from "../../utils/templates"
import { cleanVuePropSchema } from "../../utils/vueSchemaUtils"

const props = defineProps({
	widgetConfig: {},
})

const propSchema = ref(null)

const untemplatedProps = computed(() => {
	return props.widgetConfig.props
})
const templatedProps = useTemplatedData(propSchema, untemplatedProps)

const widgetProps = computed(() => {
	if (!props.widgetConfig.props) return {}
	return templatedProps.value
})

const widgetSize = computed(() => {
	if (!props.widgetConfig.size) return {}
	return props.widgetConfig.size
})

const widgetPosition = computed(() => {
	if (!props.widgetConfig.position) return {}
	return props.widgetConfig.position
})

const dynamicComponent = computed(() => {
	const component = defineAsyncComponent({
		loader: async () => {
			const widget = await loadWidget(props.widgetConfig.type)
			console.log(widget.default)
			propSchema.value = cleanVuePropSchema(widget.default.props)
			return widget
		},
	})

	return component
})
</script>
