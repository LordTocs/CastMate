<template>
    <div class="editor-base">
        <div class="editor-frame-outer">
            <drag-frame class="editor-frame" ref="dragFrame" 
                :style="frameStyle" 
                :workspaceWidth="overlay.width" 
                :workspaceHeight="overlay.height" 
                @click="frameClicked" 
                @drop="onWidgetDropped($event)"
                @dragover.prevent  
                @dragenter.prevent
                tabindex="0"
                @keyup.delete.self="doDelete"
            >
                <overlay-widget v-for="widget,i in (overlay?.widgets || [])" :key="widget.id" 
                    :modelValue="widget"
                    @update:modelValue="updateWidget($event, i)" 
                    :selected="selectedWidgetId == widget.id"
                    @update:selected="selectedWidgetId = widget.id"
                />
            </drag-frame>
        </div>
        <v-sheet class="control-panel px-2 py-2" >
            <flex-scroller class="flex-grow-1">
                <div> <!--  TODO, make flex-scroller's interior not a flex layout.-->
                    <data-input v-if="widgetPropSchema" :schema="widgetPropSchema" v-model="selectedWidgetProps"  />
                </div>
            </flex-scroller>
            <flex-scroller class="flex-grow-1">
                <overlay-toolbox />
            </flex-scroller>
        </v-sheet>
    </div>
</template>

<script setup>
import DragFrame from '../components/dragging/DragFrame.vue'
import OverlayWidget from '../components/overlays/OverlayWidget.vue'
import OverlayToolbox from '../components/overlays/OverlayToolbox.vue'
import DataInput from '../components/data/DataInput.vue'
import { ref, computed, watch } from 'vue'
import loadWidget from 'castmate-overlay-components'
import { cleanVuePropSchema } from '../utils/vueSchemaUtils.js'
import FlexScroller from '../components/layout/FlexScroller.vue'

const testOverlay = {
    width: 1920,
    height: 1080,
    widgets: [
        {
            id: "a",
            type: "Label",
            props: {
                message: "Oh HELLO"
            },
            position: {
                x: 10,
                y: 400,
            },
            size: {
                width: 100,
                height: 30,
            }
        },
        {
            id: "b",
            type: "Square",
            props: {
                message: "Oh HELLO"
            },
            position: {
                x: 10,
                y: 10,
            },
            size: {
                width: 100,
                height: 100,
            }
        },

    ]
}
const overlay = ref(testOverlay);

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



watch(selectedWidgetId, async (newId) => {
    if (!selectedWidgetId)
        return;

    widgetPropSchema.value = null;

    const widget = overlay.value?.widgets?.find((w) => w.id == newId);

    if (!widget?.type)
        return;

    const selectedWidgetComponent = await loadWidget(widget.type)
    const schema = cleanVuePropSchema(selectedWidgetComponent.default.props);
    console.log("Cleaned to ", schema);

    widgetPropSchema.value = schema
})

function updateWidget(newWidgetData, index) {
    //Use Object.assign() so we don't force reactivity at the array level, but instead at the property level.
    Object.assign(overlay.value.widgets[index], newWidgetData)
}

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
    width: 20rem;
    display: flex;
    flex-direction: column;
}
</style>