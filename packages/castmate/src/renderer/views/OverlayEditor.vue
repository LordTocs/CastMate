<template>
    <div class="editor-base">
        <div class="d-flex flex-column flex-grow-1">
            <v-sheet color="grey-darken-3" class="py-4 px-4 d-flex">
                <div class="d-flex flex-column mx-4">
                    <v-btn color="primary" fab dark class="my-1 align-self-center" @click="saveInternal"
                        :disabled="!dirty">
                        <v-icon>mdi-content-save</v-icon>
                    </v-btn>
                </div>

                <div class="flex-grow-1">
                    <div class="d-flex align-center">
                        <h1 class="flex-grow-1 my-1">{{ overlay?.name }}</h1>
                        <overlay-source-manager v-if="overlay" :overlay="overlay" :overlay-id="overlayId" />
                    </div>
                </div>
            </v-sheet>
            <div class="editor-frame-outer" v-if="overlay">
                <drag-frame class="editor-frame" ref="dragFrame" :style="frameStyle" :workspaceWidth="overlay.width"
                    :workspaceHeight="overlay.height" 
                    @click="frameClicked" 
                    @drop="onWidgetDropped($event)"
                    @dragover.prevent 
                    @dragenter.prevent 
                    tabindex="0" 
                    @keyup.delete.self="doDelete"
                >
                    <overlay-widget 
                        v-for="widget, i in (overlay?.widgets || [])" 
                        :key="widget.id" :modelValue="widget"
                        @update:modelValue="updateWidget($event, i)" 
                        :selected="selectedWidgetId == widget.id"
                        @update:selected="selectedWidgetId = widget.id" 
                    />
                </drag-frame>
            </div>
        </div>
        <v-sheet class="control-panel px-2 py-2">
            <flex-scroller style="flex: 1.5">
                <div v-if="widgetPropSchema">
                    <!--  TODO, make flex-scroller's interior not a flex layout.-->
                    <p class="text-subtitle-2 my-1">Widget Properties</p>
                    <v-text-field v-model="selectedWidgetName" label="Name" density="compact" />
                    <data-input density="compact" :schema="widgetPropSchema" v-model="selectedWidgetProps" :colorRefs="widgetColorRefs" />
                    <v-divider></v-divider>
                    <overlay-transform-input density="compact" v-model:size="selectedWidgetSize" v-model:position="selectedWidgetPosition" />
                </div>
            </flex-scroller>
            <v-divider />
            <flex-scroller class="flex-grow-1">
                <p class="text-subtitle-2 my-1">Overlay Widgets</p>
                <!--<overlay-toolbox />-->
                <overlay-widget-list v-model="overlay" @select="(id) => selectedWidgetId = id" :selected-widget-id="selectedWidgetId" />
            </flex-scroller>
        </v-sheet>
    </div>
    <confirm-dialog ref="saveDlg" />
    <v-snackbar v-model="saveSnack" :timeout="1000" color="green">
      Saved
    </v-snackbar>
</template>

<script setup>
import ConfirmDialog from '../components/dialogs/ConfirmDialog.vue'
import DragFrame from '../components/dragging/DragFrame.vue'
import OverlayWidget from '../components/overlays/OverlayWidget.vue'
import OverlayToolbox from '../components/overlays/OverlayToolbox.vue'
import OverlaySourceManager from '../components/overlays/OverlaySourceManager.vue'
import OverlayWidgetList from '../components/overlays/OverlayWidgetList.vue'
import OverlayTransformInput from '../components/overlays/OverlayTransformInput.vue'
import DataInput from '../components/data/DataInput.vue'
import { onBeforeRouteLeave, useRoute } from 'vue-router'
import { ref, computed, watch, onMounted, provide, nextTick } from 'vue'
import loadWidget from 'castmate-overlay-components'
import { cleanVuePropSchema } from '../utils/vueSchemaUtils.js'
import FlexScroller from '../components/layout/FlexScroller.vue'
import { useResourceFunctions } from '../utils/resources'
import _cloneDeep from 'lodash/cloneDeep'
import path from 'path'
import { usePathStore } from '../store/paths'
import { usePluginStore } from '../store/plugins'


const pathStore = usePathStore();

const pluginStore = usePluginStore();

const mediaFolder = computed(() => path.join(pathStore.userFolder, 'media'))

provide('isEditor', true)
provide('mediaFolder', mediaFolder)
provide('stateProvider', {
    acquireState(pluginName, stateName) {
    },
    rootState: pluginStore.rootState
})

const route = useRoute();

const overlay = ref(null);
const dirty = ref(false)

const overlays = useResourceFunctions("overlay")
const overlayId = computed(() => route.params.overlayId)

onMounted(async () => {
    const o = await overlays.getById(overlayId.value)

    if (!o) {
        return;
    }

    overlay.value = o.config
    nextTick(() => dirty.value = false)
})

const saveSnack = ref(false)
async function saveInternal() {
    console.log("Saving", overlayId.value, overlay.value);
    await overlays.setConfig(overlayId.value, _cloneDeep(overlay.value));
    saveSnack.value = true;
    dirty.value = false;
}

////////////////////////////
///// Selection Values /////
////////////////////////////

const selectedWidgetId = ref(null);
const selectedWidgetIndex = computed(() => {
    if (!selectedWidgetId.value)
        return -1
    if (!overlay.value)
        return -1

    return overlay.value?.widgets?.findIndex((w) => w.id == selectedWidgetId.value);
})
const selectedWidget = computed(() => {
    const index = selectedWidgetIndex.value
    if (index < 0)
        return undefined
    return overlay.value?.widgets?.[index];
})

const selectedWidgetName = computed({
    get() {
        return selectedWidget.value?.name;
    },
    set(value) {
        const widgetIndex = selectedWidgetIndex.value

        if (widgetIndex == -1)
            return

        overlay.value.widgets[widgetIndex].name = value;
    }
})

const selectedWidgetProps = computed({
    get() {
        return selectedWidget.value?.props;
    },
    set(value) {
        const widgetIndex = selectedWidgetIndex.value

        if (widgetIndex == -1)
            return

        overlay.value.widgets[widgetIndex].props = value;
    }
})

const selectedWidgetSize = computed({
    get() {
        return selectedWidget.value?.size;
    },
    set(value) {
        const widgetIndex = selectedWidgetIndex.value

        if (widgetIndex == -1)
            return

        overlay.value.widgets[widgetIndex].size = value;
    }
})

const selectedWidgetPosition = computed({
    get() {
        return selectedWidget.value?.position;
    },
    set(value) {
        const widgetIndex = selectedWidgetIndex.value

        if (widgetIndex == -1)
            return

        overlay.value.widgets[widgetIndex].position = value;
    }
})

/**
 * Use a computed prop to set the overlay's aspect ratio.
 */
const frameStyle = computed(() => {
    if (!overlay.value)
        return {}
    return {
        aspectRatio: `${overlay.value.width}/${overlay.value.height}`
    }
});


const widgetPropSchema = ref(null);
const widgetColorRefs = ref(null);



watch(selectedWidgetId, async (newId) => {
    if (!selectedWidgetId)
        return;

    widgetPropSchema.value = null;

    const widget = overlay.value?.widgets?.find((w) => w.id == newId);

    if (!widget?.type)
        return;

    const selectedWidgetComponent = await loadWidget(widget.type)
    const schema = cleanVuePropSchema(selectedWidgetComponent.default.props);

    widgetPropSchema.value = schema
    widgetColorRefs.value = selectedWidgetComponent.default.widget?.colorRefs;
})

function updateWidget(newWidgetData, index) {
    //Use Object.assign() so we don't force reactivity at the array level, but instead at the property level.
    Object.assign(overlay.value.widgets[index], newWidgetData)
}

watch(overlay, () => {
    dirty.value = true
}, { deep: true })

function frameClicked() {
    selectedWidgetId.value = null;
}

const dragFrame = ref(null);
/**
 * 
 * @param {DragEvent} event 
 */
function onWidgetDropped(event) {
    let containerRect = dragFrame.value.frame.getBoundingClientRect();

    const widget = JSON.parse(event.dataTransfer.getData('text/json'))

    widget.position = {
        x: (event.clientX - containerRect.left) / dragFrame.value.renderScale,
        y: (event.clientY - containerRect.top) / dragFrame.value.renderScale,
    }

    console.log("Widget Dropped!", widget);

    overlay.value.widgets.push(widget)
}

function doDelete() {
    console.log("Delete!")
    if (selectedWidgetIndex.value != -1) {
        overlay.value.widgets.splice(selectedWidgetIndex.value, 1);
        selectedWidgetId.value = null;
    }
}

const saveDlg = ref(null)

onBeforeRouteLeave(async (to, from) => {
    if (dirty.value &&
      await saveDlg.value.open(
        "Unsaved Changes",
        "Do you want to save your changes?",
        "Save Changes",
        "Discard Changes"
      )
    ) {
      await saveInternal();
    }
    return true;
})

</script>

<style scoped>
.editor-base {
    display: flex;
    flex-direction: row;
    height: 100%;
}

.editor-frame-outer {
    overflow: hidden;
    flex: 1;
    position: relative;
}

.editor-frame {
    max-width: 100%;
    max-height: 100%;
    overflow: hidden;
    margin: auto;

    border-style: solid;
    border-color: white;
    border-width: 1px;

    position: relative;
}

.editor-frame:focus {
    outline: none !important;
}

.widget-frame {
    position: absolute;
    border: solid 2px white;
}

.control-panel {
    width: 25rem;
    display: flex;
    flex-direction: column;
}
</style>