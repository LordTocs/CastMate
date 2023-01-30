import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { useIpc } from "../utils/ipcMap";

export const usePathStore = defineStore("paths", () => {

    const userFolder = ref(null);
    const mediaFolder = ref(null);

    const getPaths = useIpc("core", "getPaths")

    async function init() {
        const paths = await getPaths();
        userFolder.value = paths.userFolder
        mediaFolder.value = paths.mediaFolder
    }

    return { init, userFolder: computed(() => userFolder.value), mediaFolder: computed(() => mediaFolder.value) }
})