<template>
	<component
		:is="dynamicComponent"
		:size="widgetConfig.size || {}"
		:position="widgetConfig.size || {}"
		v-bind="widgetConfig.props ? widgetConfig.props : {}"
		class="widget"
		:style="widgetStyle"
		ref="widget"
	>
	</component>
</template>

<script>
import loadWidget from "castmate-overlay-components"
import { defineAsyncComponent } from "vue"

export default {
	props: {
		widgetConfig: {},
	},
	inject: ["bridge"],
	provide() {
		return {
			callbacks: {
				call: async (event, ...args) => {
					return await this.bridge?.call(
						event,
						this.widgetConfig.id,
						...args
					)
				},
			},
		}
	},
	computed: {
		dynamicComponent() {
			const component = defineAsyncComponent({
				loader: async () => {
					const widget = await loadWidget(this.widgetConfig.type)
					return widget
				},
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
		},
	},
	methods: {
		async callWidgetFunc(funcName, ...args) {
			if (!this.$refs.widget?.[funcName]) {
				console.log(
					"Widget",
					this.$refs.widget,
					"Doesn't have",
					funcName
				)
				return
			}
			return await this.$refs.widget[funcName](...args)
		},
		async callWidgetBroadcast(funcName, ...args) {
			if (this.$refs.widget?.[funcName]) {
				await this.$refs.widget[funcName](...args)
			}
		},
	},
}
</script>

<style scoped>
.widget {
	position: absolute;
}
</style>
