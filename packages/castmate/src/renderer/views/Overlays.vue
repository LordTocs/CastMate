<template>
  <v-container fluid>
    <file-table :files="overlayFiles" name="Overlay" @nav="onNav" @create="onCreate" @duplicate="onDuplicate" @delete="onDelete"/>
  </v-container>
</template>


<script>
import FileTable from "../components/table/FileTable.vue";
import NamedItemModal from "../components/dialogs/NamedItemModal.vue";
import { mapIpcs } from "../utils/ipcMap";

export default {
  components: { FileTable, NamedItemModal },
  data() {
    return {
        overlayFiles: [],
    };
  },
  methods: {
    ...mapIpcs("io", ["getOverlays", "createOverlay", "deleteOverlay", "cloneOverlay"]),
    async getFiles() {
      this.overlayFiles = await this.getOverlays()
    },
    onNav(name) {
      this.$router.push(`/overlays/${name}`)
    },
    async onCreate(name) {
      if (await this.createOverlay(name))
      {
        this.onNav(name);
      }
    },
    async onDuplicate(name, newName) {
      if (await this.cloneOverlay(name, newName))
      {
        this.onNav(newName);
      }
    },
    async onDelete(name) {
      await this.deleteOverlay(name);
      await this.getFiles();
    }
  }
}

</script>

<style scoped>
</style>