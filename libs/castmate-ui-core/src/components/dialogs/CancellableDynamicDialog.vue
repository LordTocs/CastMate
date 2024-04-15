<template>
	<template v-for="(instance, key) in instanceMap" :key="key">
		<p-dialog
			v-model:visible="instance.visible"
			:_instance="instance"
			v-bind="instance.options.props"
			@hide="onDialogHide(instance)"
			@after-hide="onDialogAfterHide"
		>
			<template v-if="instance.options.templates && instance.options.templates.header" #header>
				<component
					v-for="(header, index) in getTemplateItems(instance.options.templates.header)"
					:is="header"
					:key="index + '_header'"
					v-bind="instance.options.emits"
				></component>
			</template>
			<component :is="instance.content" v-bind="instance.options.emits"></component>
			<template v-if="instance.options.templates && instance.options.templates.footer" #footer>
				<component
					v-for="(footer, index) in getTemplateItems(instance.options.templates.footer)"
					:is="footer"
					:key="index + '_footer'"
					v-bind="instance.options.emits"
				></component>
			</template>
		</p-dialog>
	</template>
</template>

<script setup lang="ts">
/*
 * This component only exists because the regular DynamicDialog in primevue doesn't allow the onClose handler to be async and potentially cancel the closing.
 * Since we might need to do a resource creation, or credential validation, or other async request we need a way for dialogs to stay open and receive errors!
 */

import PDialog from "primevue/dialog"
import { useDialogEvent, DynamicDialogInstance } from "../../util/dialog-helper"
import { UniqueComponentId } from "primevue/utils"
import { ref } from "vue"

const instanceMap = ref<Record<string, DynamicDialogInstance>>({})

useDialogEvent("open", ({ instance }) => {
	const key = UniqueComponentId() + "_dynamic_dialog"

	instance.visible = true
	instance.key = key

	instanceMap.value[key] = instance
})

const currentInstance = ref<DynamicDialogInstance>()

useDialogEvent("close", async ({ instance, params }) => {
	const key = instance.key

	const inst = instanceMap.value[key]

	if (!inst) return

	if (inst.options.onClose) {
		const result = await inst.options.onClose({ data: params, type: "config-close" })
		//@ts-ignore
		if (result == false) {
			return
		}
	}

	inst.visible = false
	currentInstance.value = inst
})

function onDialogHide(instance: DynamicDialogInstance) {
	if (currentInstance.value) return
	if (instance.options.onClose) {
		instance.options.onClose({ type: "dialog-close" })
	}
}

function onDialogAfterHide() {
	currentInstance.value = undefined
}

function getTemplateItems(template: any) {
	return Array.isArray(template) ? template : [template]
}
</script>
