<template>
    <v-list >
        <draggable 
            v-model="widgets"
            item-key="id"
            :group="{ name: 'widgets'}"
        >
            <template #item="{element, index}">
                <v-list-item :title="element.name || element.id" icon @click.stop="onSelect(index)" :active="element.id == props.selectedWidgetId"> 
                    <template #prepend>
                        <v-icon :icon="widgetTypes[element.type]?.icon || 'mdi-square'" />
                    </template>
                    <template #append>
                        <v-btn icon="mdi-delete" size="x-small" variant='flat' class="mx-1" @click="deleteWidget(index)"></v-btn>
                    </template>
                </v-list-item>
            </template>
        </draggable>
    </v-list>
    <v-menu>
        <template #activator="{ props}">
            <v-btn v-bind="props" color="primary">Add Widget</v-btn>
        </template>
        <v-list>
            <v-list-item 
                v-for="widgetTypeId in Object.keys(widgetTypes)" 
                :key="widgetTypeId" 
                :title="widgetTypes[widgetTypeId]?.Name || widgetTypeId"
                @click="createWidget(widgetTypeId)"
            >
                <template #prepend>
                    <v-icon :icon="widgetTypes[widgetTypeId]?.icon || 'mid-square'" />
                </template>
            </v-list-item>
        </v-list>
    </v-menu>
</template>

<script setup>
import Draggable from "vuedraggable"
import { useModelValues } from "../../utils/modelValue"
import { cleanVuePropSchema } from '../../utils/vueSchemaUtils'
import { ref, onMounted } from "vue"
import loadWidget, { getAllWidgets } from 'castmate-overlay-components'
import { nanoid } from "nanoid/non-secure"
import { constructDefaultSchema } from "../../utils/objects"

const props = defineProps({
    modelValue: {},
    selectedWidgetId: { type: String },
})

const emit = defineEmits(['update:modelValue', 'select'])

const { widgets } = useModelValues(props, emit, ['widgets'])

const widgetTypes = ref({})

onMounted(async () => {
    const widgetIds = getAllWidgets()

    const widgetModules = await Promise.all(widgetIds.map((wid) => loadWidget(wid)))

    const result = {};

    for (let i = 0; i < widgetModules.length; ++i)
    {
        const wm = widgetModules[i];
        const id = widgetIds[i];

        
        result[id] = {
            id,
            ...wm.default.widget,
            propSchema: cleanVuePropSchema(wm.default.props)    
        }
    }

    widgetTypes.value = result;
})

function onSelect(index) {
    emit('select', props.modelValue?.widgets?.[index]?.id)
}

function deleteWidget(index) {
    const newArray = [...widgets.value]
    newArray.splice(index, 1)
    widgets.value = newArray
}

function getNewName(widgetTypeId) {
    const widgetType = widgetTypes.value[widgetTypeId]

    let index = 1;
    while (true) {
        const name = `${widgetType.name || widgetTypeId} #${index}`
        if (!widgets.value.find(w => w.name == name))
        {
            return name;
        }
        ++index
    }
}

function createWidget(widgetTypeId) {
    const widgetType = widgetTypes.value[widgetTypeId]

    if (!widgetType)
        return;

    const newWidget = {
        id: nanoid(),
        name: getNewName(widgetTypeId),
        type: widgetTypeId,
        props: constructDefaultSchema(widgetType.propSchema),
        size: {
            width: widgetType.defaultSize?.width || 100,
            height: widgetType.defaultSize?.height || 100,
        },
        position: {
            x: 0,
            y: 0
        }
    }

    console.log("Emitting", newWidget)

    widgets.value = [...widgets.value, newWidget]
}

</script>