<template>
	<div class="overlay-editor">
		<div class="overlay-editor-header">
			<div class="pt-4 flex flex-row w-full">
				<div class="flex-grow-1">
					<data-input
						:schema="{ type: ResourceProxyFactory, resourceType: 'OBSConnection', name: `OBS Connection` }"
						v-model="view.obsId"
					/>
				</div>
				<div class="p-inputgroup var-edit" v-bind="$attrs">
					<p-check-box binary input-id="showPreview" v-model="view.showPreview" />
					<label for="showPreview" class="ml-2"> Preview </label>
				</div>
			</div>
		</div>
		<div class="flex flex-row flex-grow-1">
			<document-path local-path="widgets">
				<overlay-edit-area v-model="model" v-model:view="view" style="flex: 1" />
			</document-path>
			<div class="overlay-properties flex flex-column">
				<document-path local-path="widgets">
					<overlay-widget-prop-edit v-model="model" />
				</document-path>
				<!-- <flex-scroller>
					<data-input
						v-if="selectedWidgetIndex != null && selectedWidgetInfo != null"
						v-model="model.widgets[selectedWidgetIndex].config"
						:schema="selectedWidgetInfo.component.widget.config"
					/>
				</flex-scroller> -->
				<div></div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { OverlayConfig } from "castmate-plugin-overlays-shared"
import { OverlayEditorView } from "./overlay-edit-types"
import { DataInput, ResourceProxyFactory, usePluginStore, DocumentPath } from "castmate-ui-core"
import { computed, onMounted, ref, useModel } from "vue"
import OverlayWidgetPropEdit from "./OverlayWidgetPropEdit.vue"

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

.overlay-properties {
	background-color: var(--surface-b);
	user-select: none;
	width: 350px;
	overflow-y: auto;
}
</style>
