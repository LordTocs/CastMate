<template>
    <div class="editor-base">
        <div class="editor-frame-outer">
            <drag-frame class="editor-frame" ref="dragFrame" :style="frameStyle" :workspaceWidth="overlay.width" :workspaceHeight="overlay.height" @click="frameClicked">
                <overlay-widget v-for="widget,i in (overlay?.widgets || [])" :key="widget.id" 
                    :modelValue="widget"
                    @update:modelValue="updateWidget($event, i)" 
                    :selected="selectedWidgetId == widget.id"
                    @update:selected="selectedWidgetId = widget.id"
                />
            </drag-frame>
        </div>
        <v-sheet class="control-panel px-2 py-2" >
            <data-input v-if="widgetPropSchema" :schema="widgetPropSchema" v-model="selectedWidgetProps"  />
        </v-sheet>
    </div>
</template>

<script setup>
import DragFrame from '../components/dragging/DragFrame.vue'
import OverlayWidget from '../components/overlays/OverlayWidget.vue'
import DataInput from '../components/data/DataInput.vue'
import { ref, computed, watch } from 'vue';
import loadWidget from 'castmate-overlay-components';

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
        
        Object.assign(overlay.value.widgets[widgetIndex].props, value);
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

/**
 * Convert a vue props object from a compiled component into a compatible JSON schema object with data-input
 * 
 * @param {*} propSchema 
 */
function cleanVuePropSchema(propSchema) {
    const result = {
        type: 'Object',
        properties: {}
    }

    for (let propKey in propSchema) {
        result.properties[propKey] = {
            ...propSchema[propKey],
            type: propSchema[propKey].type.name
        }

        delete result.properties[propKey]['0']
        delete result.properties[propKey]['1']
    }

    return result;
}

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
})

function updateWidget(newWidgetData, index) {
    //Use Object.assign() so we don't force reactivity at the array level, but instead at the property level.
    Object.assign(overlay.value.widgets[index], newWidgetData)
}

function frameClicked() {
    selectedWidgetId.value = null;
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

.widget-frame {
    position: absolute;
    border: solid 2px white;
}

.control-panel {
    width: 20rem;
}
</style>