<template>
	<div>
		<div class="flex flex-row">
			<div class="p-inputgroup" style="flex-grow: 1; flex-shrink: 1">
				<label-floater :model-value="modelValue" :label="schema.name" :no-float="noFloat" v-slot="labelProps">
					<template-toggle v-bind="labelProps" v-model="model" :template-mode="canTemplate && templateMode">
						<slot v-bind="labelProps"></slot>
					</template-toggle>
				</label-floater>
				<slot name="extra" v-if="!(canTemplate && templateMode)"></slot>
			</div>

			<p-button
				v-if="hasMenu"
				class="ml-1"
				text
				icon="mdi mdi-dots-vertical"
				aria-controls="input_menu"
				@click="menu?.toggle($event)"
			></p-button>
			<p-menu ref="menu" id="input_menu" :model="menuItems" :popup="true" v-if="hasMenu" />
		</div>

		<div class="flex flex-row">
			<error-label :error-message="errorMessage" />
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, markRaw, ref, useModel } from "vue"
import { LabelFloater, TemplateToggle, DocumentPath } from "../../../main"
import ErrorLabel from "./ErrorLabel.vue"
import { Schema } from "castmate-schema"
import { useValidator } from "../../../util/validation"

import PButton from "primevue/button"
import PMenu from "primevue/menu"
import { MenuItem, MenuItemCommandEvent } from "primevue/menuitem"

const props = withDefaults(
	defineProps<{
		modelValue: any
		schema: Schema & { template?: boolean }
		noFloat?: boolean
		showClear?: boolean
		menuExtra?: MenuItem[]
		toggleTemplate?: boolean
	}>(),
	{
		showClear: true,
		toggleTemplate: true,
	}
)

const model = useModel(props, "modelValue")

function clear() {
	model.value = undefined
}
const canClear = computed(() => !props.schema.required)

const menuItems = computed<MenuItem[]>(() => {
	let result: MenuItem[] = []

	if (props.menuExtra) {
		result.push(...props.menuExtra)
	}

	if (canTemplate.value && props.toggleTemplate) {
		if (templateMode.value) {
			result.push({
				label: "Disable Templating",
				command(event) {
					templateMode.value = false
				},
			})
		} else {
			result.push({
				label: "Enabling Templating",
				command(event) {
					templateMode.value = true
				},
			})
		}
	}

	if (canClear.value) {
		result.push({
			label: "Clear",
			command(event) {
				clear()
			},
		})
	}

	return result
})

const hasMenu = computed(() => {
	return menuItems.value.length > 0
})

const menu = ref<PMenu>()

const canTemplate = computed(() => !!props.schema.template)

const templateMode = ref(false)

const errorMessage = useValidator(model, () => props.schema)
</script>
