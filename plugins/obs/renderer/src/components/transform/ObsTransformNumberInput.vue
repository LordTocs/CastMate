<template>
	<div class="p-inputgroup obs-transform-number">
		<label-floater v-model="strModel" :label="label" :input-id="inputId" v-slot="labelProps">
			<template-toggle
				v-model="strModel"
				:template-mode="templateMode"
				v-bind="labelProps"
				v-slot="templateProps"
				@contextmenu="menu?.show($event)"
			>
				<p-input-number v-model="numModel" v-bind="templateProps" :format="false" :suffix="unit" />
			</template-toggle>
		</label-floater>
		<!-- <p-button
			class="ml-1"
			text
			icon="mdi mdi-dots-vertical"
			aria-controls="overlay_menu"
			@click="menu?.toggle($event)"
		></p-button> -->
		<c-context-menu :items="menuItems" ref="menu"></c-context-menu>
		<!-- <p-menu ref="menu" id="overlay_menu" :model="menuItems" :popup="true" /> -->
	</div>
</template>

<script setup lang="ts">
import { TemplateNumber } from "castmate-schema"
import { LabelFloater, TemplateToggle, ClearButton, CContextMenu } from "castmate-ui-core"
import { useModel, ref, computed, onMounted } from "vue"
import { OBSWSSourceTransform } from "castmate-plugin-obs-shared"
import PInputNumber from "primevue/inputnumber"
import PButton from "primevue/button"
import PMenu from "primevue/menu"
import { MenuItem } from "primevue/menuitem"

const props = defineProps<{
	modelValue: TemplateNumber | undefined
	canTemplate?: boolean
	label?: string
	inputId: string
	wsProp: keyof OBSWSSourceTransform
	unit?: string
}>()

const model = useModel(props, "modelValue")

const emit = defineEmits(["update:modelValue"])

const strModel = computed<string | undefined>({
	get() {
		return props.modelValue as string | undefined
	},
	set(v) {
		emit("update:modelValue", v)
	},
})

const numModel = computed<number | undefined>({
	get() {
		return props.modelValue as number | undefined
	},
	set(v) {
		emit("update:modelValue", v == null ? undefined : v)
	},
})

const templateMode = ref(false)

onMounted(() => {
	templateMode.value = props.modelValue != null && isNaN(Number(props.modelValue))
})

defineExpose({
	extractFromWS(wsData: Partial<OBSWSSourceTransform>) {
		if (wsData[props.wsProp] != null) {
			model.value = wsData[props.wsProp]
		}
	},
})

//const menu = ref<InstanceType<typeof PMenu>>()
const menu = ref<InstanceType<typeof CContextMenu>>()
const menuItems = computed<MenuItem[]>(() => {
	const result: MenuItem[] = [
		{
			label: `Clear`,
			command(event) {
				model.value = undefined
			},
		},
	]

	if (props.canTemplate) {
		result.push({
			label: templateMode.value ? "Disable Template" : "Enable Template",
			command(event) {
				templateMode.value = !templateMode.value
			},
		})
	}

	return result
})
</script>

<style scoped>
.obs-transform-number {
	margin-top: 1.5rem;
}
</style>
