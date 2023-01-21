<template>
    <v-sheet>
        <v-divider />
        <v-list color="grey darken-4" dense>
            <v-list-item v-for="widget of widgets" :key="widget.id" 
                style="cursor: grab; user-select: none;"
                :title="widget.name" 
                :subtitle="widget.description"
                :draggable="true"
                @dragstart="onDragStart(widget, $event)"
                >
                <template #prepend>
                    <v-avatar>
                        <v-icon :icon="widget?.icon
                        ? widget.icon
                        : 'mdi-file-document-outline'" />
                    </v-avatar>
                </template>
            </v-list-item>
        </v-list>
    </v-sheet>
</template>


<script setup>
import { computed, onMounted, ref } from 'vue';
import { constructDefaultSchema } from "../../utils/objects";
import loadWidget, { getAllWidgets } from 'castmate-overlay-components'
import { nanoid } from 'nanoid/non-secure'
import { cleanVuePropSchema } from '../../utils/vueSchemaUtils';
const widgets = ref([])

onMounted(async () => {
    const widgetIds = getAllWidgets()

    const widgetModules = await Promise.all(widgetIds.map((wid) => loadWidget(wid)))

    widgets.value = widgetModules.map((wm,i) => ({
        id: widgetIds[i],
        ...wm.default.widget,
        propSchema: cleanVuePropSchema(wm.default.props)
     }))
})

/**
 * 
 * @param {*} widget 
 * @param {DragEvent} event 
 */
function onDragStart(widget, event) {
    event.dataTransfer.setData("text/json", JSON.stringify({
        id: nanoid(),
        type: widget.id,
        props: constructDefaultSchema(widget.propSchema),
        size: {
            width: widget.defaultSize?.width || 50,
            height: widget.defaultSize?.height || 50,
        }
    }));
}

</script>