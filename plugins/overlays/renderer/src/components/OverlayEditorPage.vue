<template>
	<div class="overlay-editor" ref="editorDiv">
		<div class="overlay-editor-header">
			<div class="pt-4 px-1 flex flex-row w-full justify-content-center gap-1">
				<div ref="settingsMenuContainer">
					<p-button icon="mdi mdi-cog" @click="settingsMenuToggle"></p-button>
				</div>
				<drop-down-panel
					v-model="settingsMenuOpen"
					:container="settingsMenuContainer"
					:style="{
						minWidth: '25rem',
						overflowY: 'auto',
					}"
				>
					<div class="p-1 pt-3 flex flex-column gap-4" @mousedown="stopPropagation">
						<div class="flex flex-row pt-3 gap-1">
							<div style="width: 0; flex: 1">
								<label-floater label="Width" v-slot="labelProps">
									<p-input-number
										class="number-fix"
										v-model="model.size.width"
										v-bind="labelProps"
										show-buttons
										mode="decimal"
										suffix="px"
									/>
								</label-floater>
							</div>
							<div style="width: 0; flex: 1">
								<label-floater label="Height" v-slot="labelProps">
									<p-input-number
										class="number-fix"
										v-model="model.size.height"
										v-bind="labelProps"
										show-buttons
										mode="decimal"
										suffix="px"
									/>
								</label-floater>
							</div>
						</div>
					</div>
				</drop-down-panel>
				<div class="flex-grow-1">
					<data-input
						:schema="{ type: ResourceProxyFactory, resourceType: 'OBSConnection', name: `OBS Connection` }"
						v-model="view.obsId"
					/>
				</div>
				<div>
					<overlay-add-to-obs-button :obsId="view.obsId" :overlay-config="model" :overlay-id="overlayId" />
				</div>
				<div ref="previewMenuContainer">
					<p-button icon="mdi mdi-image-edit" @click="previewMenuToggle" />
				</div>
				<drop-down-panel
					v-model="previewMenuOpen"
					:container="previewMenuContainer"
					:style="{
						minWidth: '25rem',
						overflowY: 'auto',
						maxHeight: '15rem',
					}"
				>
					<overlay-preview-menu v-model="model.preview" />
				</drop-down-panel>
				<div>
					<p-button
						icon="mdi mdi-open-in-app"
						@click="openOverlayDebug"
						v-tooltip="'Open in Browser'"
					></p-button>
				</div>
			</div>
		</div>
		<div class="flex flex-row flex-grow-1">
			<data-binding-path local-path="widgets">
				<overlay-edit-area v-model="model" v-model:view="view" style="flex: 1" />
			</data-binding-path>
			<div class="overlay-properties">
				<p-splitter layout="vertical" class="h-full">
					<p-splitter-panel>
						<data-binding-path local-path="widgets">
							<overlay-widget-prop-edit class="h-full" v-model="model" />
						</data-binding-path>
					</p-splitter-panel>
					<p-splitter-panel>
						<data-binding-path local-path="widgets">
							<overlay-widget-list class="h-full" v-model="model" />
						</data-binding-path>
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
	DataBindingPath,
	useDocumentId,
	useSettingValue,
	DropDownPanel,
	LabelFloater,
	stopPropagation,
	provideScrollAttachable,
} from "castmate-ui-core"
import { computed, onMounted, ref, useModel, watch } from "vue"
import OverlayWidgetPropEdit from "./OverlayWidgetPropEdit.vue"
import OverlayWidgetList from "./OverlayWidgetList.vue"
import OverlayPreviewMenu from "./OverlayPreviewMenu.vue"
import OverlayAddToObsButton from "./OverlayAddToObsButton.vue"

import PSplitter from "primevue/splitter"
import PSplitterPanel from "primevue/splitterpanel"
import PCheckBox from "primevue/checkbox"
import PInputNumber from "primevue/inputnumber"
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

const editorDiv = ref<HTMLElement>()

provideScrollAttachable(editorDiv)

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

const previewMenuOpen = ref(false)
const previewMenuContainer = ref<HTMLElement>()

function previewMenuToggle(ev: MouseEvent) {
	if (!previewMenuOpen.value && model.value.preview == null) {
		console.log("Creating Whole Preview")
		model.value.preview = {
			offsetX: 0,
			offsetY: 0,
			source: undefined,
		}
	}

	previewMenuOpen.value = !previewMenuOpen.value
}

const settingsMenuContainer = ref<HTMLElement>()
const settingsMenuOpen = ref(false)
function settingsMenuToggle(ev: MouseEvent) {
	settingsMenuOpen.value = !settingsMenuOpen.value
}

onMounted(() => {
	watch(
		() => props.modelValue.preview,
		() => {
			console.log("Preview", props.modelValue.preview)
		},
		{ immediate: true, deep: true }
	)
})
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

.number-fix :deep(.p-inputtext) {
	width: 100% !important;
}
</style>
