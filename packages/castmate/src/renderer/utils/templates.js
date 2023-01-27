import { onMounted, onUnmounted, computed, unref, watch, watchEffect } from 'vue'
import { useIpc } from './ipcMap'
import { nanoid } from 'nanoid/non-secure'
import { defineStore } from "pinia";
import { ref } from "vue";
import { ipcRenderer } from 'electron';

export const useRemoteTemplateStore = defineStore("remoteTemplates", () => {

    const templateData = ref({})

    async function init() {
        ipcRenderer.on('templates_updateTemplatedData', (event, id, data) => {
            //console.log("Received Templated Data", id, templatedData)
            templateData.value[id] = data
        })
    }

    async function createTemplateData(id) {
        templateData.value[id] = {}
    }

    function clearTemplateData(id) {
        delete templateData.value[id]
    }

    const templates = computed( () => templateData.value )

    return { init, createTemplateData, clearTemplateData, templates }
})

export function useTemplatedData(schema, data) {
    
    const templateStore = useRemoteTemplateStore();
    const updateData = useIpc('templates', 'updateData')
    const createEvaluator = useIpc('templates', 'createEvaluator')
    const releaseEvaluator = useIpc('templates', 'releaseEvaluator')

    const id = nanoid();
    let mounted = false;

    const templatedData = computed(() => {
        return templateStore.templates[id]
    })

    watch(() => unref(data), () => {
        //console.log("Data Changed!!", id)
        if (mounted) {
            //console.log("Data Changed", id)
            updateData(id, unref(data))
        }
    })

    watch(() => unref(schema), async () => {
        //console.log("Schema Changed!", id)
        await release()
        await setup()
    })

    async function setup() {
        if (!unref(schema) || !unref(data))
            return
        
        //console.log("Setting Up Templates", id)
        await templateStore.createTemplateData(id)
        await createEvaluator(id, unref(schema), unref(data))
        mounted = true
    }

    async function release() {
        if (!mounted)
        {
            return;
        }
        //console.log("Releasing", id)

        await releaseEvaluator(id)
        await templateStore.clearTemplateData(id)
        mounted = false
    }

    onMounted(async () => {
        await setup()
    })

    onUnmounted(async () => {
        await release()
    })

    return templatedData
}