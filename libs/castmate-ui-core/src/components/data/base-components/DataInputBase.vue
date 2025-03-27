<template>
	<div>
		<div class="flex flex-row">
			<p-input-group style="flex-grow: 1; flex-shrink: 1; max-width: 100%" @contextmenu="onContext">
				<slot name="prepend" v-if="!(canTemplate && templateMode)"></slot>
				<label-floater :model-value="modelValue" :label="schema.name" :no-float="noFloat" v-slot="labelProps">
					<template-toggle
						v-bind="labelProps"
						v-model="model"
						:template-mode="canTemplate && templateMode"
						:disabled
						:multi-line="schema.multiLine"
					>
						<slot v-bind="labelProps"></slot>
					</template-toggle>
				</label-floater>
				<slot name="extra" v-if="!(canTemplate && templateMode)"></slot>
			</p-input-group>

			<data-input-base-menu
				v-model="model"
				v-model:template-mode="templateMode"
				ref="inputMenu"
				:can-template="canTemplate && toggleTemplate"
				:can-clear="canClear"
				:menu-extra="menuExtra"
				:disabled="disabled"
			/>
		</div>

		<!-- <div class="flex flex-row">
			<error-label :error-message="errorMessage" />
		</div> -->
	</div>
</template>

<script setup lang="ts">
import { computed, markRaw, onBeforeMount, onMounted, ref, useModel } from "vue"
import { LabelFloater, TemplateToggle, defaultStringIsTemplate } from "../../../main"
import ErrorLabel from "./ErrorLabel.vue"
import { Schema } from "castmate-schema"
import { useValidator } from "../../../util/validation"

import type { MenuItem } from "primevue/menuitem"
import PInputGroup from "primevue/inputgroup"

import DataInputBaseMenu from "./DataInputBaseMenu.vue"

const props = withDefaults(
	defineProps<{
		modelValue: any
		schema: Schema & { template?: boolean; multiLine?: boolean }
		noFloat?: boolean
		showClear?: boolean
		menuExtra?: MenuItem[]
		toggleTemplate?: boolean
		disabled?: boolean
		isTemplate?: (value: any) => boolean
	}>(),
	{
		showClear: true,
		toggleTemplate: true,
		isTemplate: defaultStringIsTemplate,
	}
)

const model = useModel(props, "modelValue")

const canClear = computed(() => !props.schema.required)

const inputMenu = ref<InstanceType<typeof DataInputBaseMenu>>()

const canTemplate = computed(() => !!props.schema.template)

const templateMode = ref(false)

onBeforeMount(() => {
	if (canTemplate.value) {
		templateMode.value = props.isTemplate(props.modelValue)
	}
})

const errorMessage = useValidator(model, () => props.schema)

function onContext(ev: MouseEvent) {
	inputMenu.value?.openContext(ev)
}
</script>
