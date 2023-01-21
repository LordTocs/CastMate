import { onMounted, onUnmounted, computed, unref, watch, watchEffect } from 'vue'
import { useIpc } from './ipcMap'
import { nanoid } from 'nanoid/non-secure'
import { useStore } from 'vuex'


export function useTemplatedData(schema, data) {
    
    const store = useStore();
    const updateData = useIpc('templates', 'updateData')
    const createEvaluator = useIpc('templates', 'createEvaluator')
    const releaseEvaluator = useIpc('templates', 'releaseEvaluator')

    const id = nanoid();
    let mounted = false;

    const templatedData = computed(() => {
        return store.getters['remoteTemplates/templateData'][id]
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
        store.commit('remoteTemplates/createTemplateData', { id })
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
        store.commit('remoteTemplates/clearTemplateData', { id })
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