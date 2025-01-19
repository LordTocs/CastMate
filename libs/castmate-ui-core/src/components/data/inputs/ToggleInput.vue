<template>
	<div class="flex flex-row align-items-center" @contextmenu="onContext" v-bind="$attrs" ref="rowDiv">
		<template-toggle
			style="flex-grow: 1; flex-shrink: 1"
			:template-mode="templateMode"
			v-model="model"
			v-slot="templateProps"
			ref="templateToggle"
		>
			<p-input-group v-bind="templateProps">
				<toggle-switch
					input-id="switch"
					v-model="model"
					:true-icon="schema.trueIcon"
					:false-icon="schema.falseIcon"
					:toggle-icon="schema.toggleIcon"
				/>
				<label for="switch" class="ml-2 p-text-secondary align-self-center" v-if="schema.name">
					{{ schema.name }}
				</label>
			</p-input-group>
		</template-toggle>
		<data-input-base-menu
			ref="inputMenu"
			v-model="model"
			v-model:template-mode="templateMode"
			:can-clear="canClear"
			:can-template="canTemplate"
		/>
	</div>
</template>

<script setup lang="ts">
import { Toggle } from "castmate-schema"
import { computed, onMounted, ref, useModel } from "vue"
import ToggleSwitch from "../base-components/ToggleSwitch.vue"
import { SchemaToggle } from "castmate-schema"
import { SharedDataInputProps, defaultStringIsTemplate } from "../DataInputTypes"
import TemplateToggle from "../base-components/TemplateToggle.vue"
import DataInputBaseMenu from "../base-components/DataInputBaseMenu.vue"
import PInputGroup from "primevue/inputgroup"
import { useDataBinding, useDataUIBinding } from "../../../util/data-binding"

const props = defineProps<
	{
		modelValue: Toggle
		schema: SchemaToggle
	} & SharedDataInputProps
>()

useDataBinding(() => props.localPath)

const model = useModel(props, "modelValue")

const templateMode = ref(false)

const canClear = computed(() => !props.schema.required)
const canTemplate = computed(() => !!props.schema.template)

const inputMenu = ref<InstanceType<typeof DataInputBaseMenu>>()

onMounted(() => {
	if (canTemplate.value) {
		templateMode.value = defaultStringIsTemplate(props.modelValue)
	}
})

function onContext(ev: MouseEvent) {
	inputMenu.value?.openContext(ev)
}

const templateToggle = ref<InstanceType<typeof TemplateToggle>>()
const rowDiv = ref<HTMLElement>()

useDataUIBinding({
	scrollIntoView() {
		rowDiv.value?.scrollIntoView()
	},
})
</script>

<style scoped>
.data-prop {
	margin-top: 0.5rem !important;
}

.data-prop:nth-child(1) {
	margin-top: 0 !important;
}
</style>
