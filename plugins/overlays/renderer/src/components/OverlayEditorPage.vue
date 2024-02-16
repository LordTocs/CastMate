<template>
	<div class="overlay-editor">
		<div class="overlay-editor-header">
			<div class="pt-4">
				<data-input
					:schema="{ type: ResourceProxyFactory, resourceType: 'OBSConnection', name: `OBS Connection` }"
					v-model="view.obsId"
				/>
				<div class="p-inputgroup var-edit" v-bind="$attrs">
					<p-check-box binary input-id="showPreview" v-model="view.showPreview" />
					<label for="showPreview" class="ml-2"> Preview </label>
				</div>
			</div>
		</div>
		<overlay-edit-area v-model="model" v-model:view="view" style="flex: 1" />
	</div>
</template>

<script setup lang="ts">
import { OverlayConfig } from "castmate-plugin-overlays-shared"
import { OverlayEditorView } from "./overlay-edit-types"
import { DataInput, ResourceProxyFactory, usePluginStore, useResourceStore } from "castmate-ui-core"
import { onMounted, ref, useModel } from "vue"
import PButton from "primevue/button"
import PCheckBox from "primevue/checkbox"
import OverlayEditArea from "./OverlayEditArea.vue"

const props = defineProps<{
	modelValue: OverlayConfig
	view: OverlayEditorView
}>()

const pluginStore = usePluginStore()

onMounted(() => {
	const defaultObsSetting = pluginStore.pluginMap.get("obs")?.settings?.obsDefault
	if (defaultObsSetting?.type == "value") {
		const defaultId = defaultObsSetting.value
		if (defaultId) {
			view.value.obsId = defaultId
		}
	}
})

const model = useModel(props, "modelValue")
const view = useModel(props, "view")
</script>

<style scoped>
.overlay-editor-header {
	display: flex;
	flex-direction: row;
	min-height: 5rem;
	background-color: var(--surface-b);
}

.overlay-editor {
	display: flex;
	flex-direction: column;
}
</style>
