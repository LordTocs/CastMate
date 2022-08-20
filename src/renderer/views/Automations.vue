<template>
  <v-container fluid>
    <file-table :files="automationFiles" name="Automation" @nav="onNav" @create="onCreate" @duplicate="onDuplicate" @delete="onDelete"/>
  </v-container>
</template>

<script>

import { mapIpcs } from "../utils/ipcMap";
import FileTable from "../components/table/FileTable.vue";
import NamedItemModal from "../components/dialogs/NamedItemModal.vue";

export default {
  components: { FileTable, NamedItemModal },
  data() {
    return {
      automationFiles: [],
    };
  },
  methods: {
    ...mapIpcs("io", ["getAutomations", "createAutomation", "deleteAutomation", "cloneAutomation"]),
    async getFiles() {
      this.automationFiles = await this.getAutomations()
    },
    onNav(name) {
      this.$router.push(`/automations/${name}`)
    },
    async onCreate(name) {
      if (await this.createAutomation(name))
      {
        this.onNav(name);
      }
    },
    async onDuplicate(name, newName) {
      if (await this.cloneAutomation(name, newName))
      {
        this.onNav(newName);
      }
    },
    async onDelete(name) {
      await this.deleteAutomation(name);
      await this.getFiles();
    }
  },
  async mounted() {
    await this.getFiles();
  },
};
</script>
