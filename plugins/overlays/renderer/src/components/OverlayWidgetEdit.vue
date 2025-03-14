<template>
	<pan-area-resizable
		ref="resizable"
		v-model:position="model.position"
		v-model:size="model.size"
		:scale-size="zoomScale"
		:show-drag="isSelected && !model.locked"
		:can-scale="isOnlySelection"
		v-bind="$attrs"
		@contextmenu="onContext"
	>
		<component
			v-if="widgetComponent && resolvedConfig != null && props.modelValue.visible"
			:is="widgetComponent"
			:config="resolvedConfig"
			:size="model.size"
			:position="model.position"
		/>
	</pan-area-resizable>
	<c-context-menu ref="contextMenu" :items="contextItems" />
</template>

<script setup lang="ts">
import { OverlayWidgetConfig } from "castmate-plugin-overlays-shared"
import {
	PanAreaResizable,
	useDocumentSelection,
	useFullState,
	useIsSelected,
	CContextMenu,
	NameDialog,
	useMediaStore,
	useDataBinding,
} from "castmate-ui-core"
import { ComputedRef, computed, inject, markRaw, onMounted, provide, ref, useModel, watch } from "vue"
import { useOverlayWidgets } from "castmate-overlay-widget-loader"
import { useRemoteOverlayConfig } from "../config/overlay-config"
import { CastMateBridgeImplementation, provideEditorMediaResolver } from "castmate-overlay-core"

import { useDialog } from "primevue/usedialog"
import type { MenuItem } from "primevue/menuitem"

const isSelected = useIsSelected(() => props.modelValue.id)
const selection = useDocumentSelection()

const isOnlySelection = computed(() => {
	return isSelected.value && selection.value.length == 1
})

const props = defineProps<{
	modelValue: OverlayWidgetConfig
	localPath?: string
}>()

useDataBinding(() => props.localPath)

onMounted(() => {
	console.log("Mount Widget Edit", props.modelValue)
})

provide("isEditor", true)

const mediaStore = useMediaStore()
provideEditorMediaResolver({
	resolveMedia(file) {
		const media = mediaStore.media[file]

		return media?.file ?? ""
	},
})

const resizable = ref<InstanceType<typeof PanAreaResizable>>()

defineExpose({
	frame: computed(() => resizable.value?.frame),
})

const model = useModel(props, "modelValue")

const zoomScale = inject<ComputedRef<number>>(
	"overlay-zoom-scale",
	computed(() => 1)
)

const resolvedConfig = useRemoteOverlayConfig(() => props.modelValue)

const widgetStore = useOverlayWidgets()

//TODO: Is this bad?
const state = useFullState()

provide<CastMateBridgeImplementation>("castmate-bridge", {
	acquireState(plugin, state) {},
	releaseState(plugin, state) {},
	config: computed(() => props.modelValue),
	state,
	registerRPC(id, func) {},
	unregisterRPC(id) {},
	registerMessage(id, func) {},
	unregisterMessage(id, func) {},
	async callRPC(id, ...args) {},
})

const widgetComponent = computed(
	() => widgetStore.getWidget(props.modelValue.plugin, props.modelValue.widget)?.component
)

const contextMenu = ref<InstanceType<typeof CContextMenu>>()
const dialog = useDialog()
const emit = defineEmits(["delete"])

const contextItems = computed<MenuItem[]>(() => {
	return [
		{
			label: "Rename",
			icon: "mdi mdi-rename",
			command(event) {
				dialog.open(NameDialog, {
					props: {
						header: `Rename ${model.value.name}?`,
						style: {
							width: "25vw",
						},
						modal: true,
					},
					data: {
						existingName: model.value.name,
					},
					onClose(options) {
						if (!options?.data) {
							return
						}

						model.value.name = options.data as string
					},
				})
			},
		},
		{
			label: "Delete",
			icon: "mdi mdi-delete",
			command(event) {
				emit("delete")
			},
		},
	]
})

function onContext(ev: Event) {
	if (props.modelValue.locked) return

	contextMenu.value?.show(ev)
}
</script>

<style scoped></style>
