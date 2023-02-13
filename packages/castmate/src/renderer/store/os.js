import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { useIpc } from '../utils/ipcMap';


export const useOSStore = defineStore("os", () => {

    const getFonts = useIpc("os", "getFonts")

    const fonts = ref([])

    async function init () {
        fonts.value = await getFonts()
    }

    return { init, fonts: computed(() => fonts.value) }
})