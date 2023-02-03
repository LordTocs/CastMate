import { ipcRenderer } from "electron";
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { useIpc } from "../utils/ipcMap";


export const useStreamPlanStore = defineStore("streamplan", () => {

    const planId = ref(null)
    const segmentId = ref(null)

    const getCurrentPlan = useIpc("streamplan", "getCurrentPlan")
    const getCurrentSegment = useIpc("streamplan", "getCurrentSegment")

    async function init() {

        planId.value = await getCurrentPlan()
        segmentId.value = await getCurrentSegment()


        ipcRenderer.on("streamplan_setCurrentPlan", (event, id) => {
            planId.value = id
        })

        ipcRenderer.on("streamplan_setCurrentSegment", (event, id) => {
            segmentId.value = id
        })
    }

    return { init, planId: computed(() => planId.value), segmentId: computed(() => segmentId.value) }
})