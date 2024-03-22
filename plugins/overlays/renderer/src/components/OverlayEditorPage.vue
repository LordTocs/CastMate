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
				<div>
					<p-button icon="mdi-open-in-app" size="small" @click="openOverlayDebug"></p-button>
				</div>
			</div>
		</div>
		<div class="flex flex-row flex-grow-1">
			<document-path local-path="widgets">
				<overlay-edit-area v-model="model" v-model:view="view" style="flex: 1" />
			</document-path>
			<div class="overlay-properties">
				<p-splitter layout="vertical" class="h-full">
					<p-splitter-panel>
						<document-path local-path="widgets">
							<overlay-widget-prop-edit v-model="model" />
						</document-path>
					</p-splitter-panel>
					<p-splitter-panel>
						<document-path local-path="widgets">
							<overlay-widget-list v-model="model" />
						</document-path>
					</p-splitter-panel>
				</p-splitter>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { OverlayConfig } from "castmate-plugin-overlays-shared"
import { OverlayEditorView } from "./overlay-edit-types"
import {
	DataInput,
	ResourceProxyFactory,
	usePluginStore,
	DocumentPath,
	useDocumentId,
	useSettingValue,
} from "castmate-ui-core"
import { computed, onMounted, ref, useModel } from "vue"
import OverlayWidgetPropEdit from "./OverlayWidgetPropEdit.vue"
import OverlayWidgetList from "./OverlayWidgetList.vue"

import PSplitter from "primevue/splitter"
import PSplitterPanel from "primevue/splitterpanel"
import PCheckBox from "primevue/checkbox"
import PButton from "primevue/button"
import OverlayEditArea from "./OverlayEditArea.vue"

const props = defineProps<{
	modelValue: OverlayConfig
	view: OverlayEditorView
	pageData: { resourceId: string }
}>()

const overlayId = useDocumentId()

const port = useSettingValue({ plugin: "castmate", setting: "port" })
const defaultObsSetting = useSettingValue({ plugin: "obs", setting: "obsDefault" })

const overlayUrl = computed(() => {
	return `http://localhost:${port.value ?? 8181}/overlays/${overlayId.value}`
})

function openOverlayDebug() {
	window.open(overlayUrl.value, "_blank")
}

onMounted(() => {
	if (defaultObsSetting.value != null) {
		view.value.obsId = defaultObsSetting.value
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
}
</style>
