<template>
  <v-container fluid>
    <file-table :files="automationFiles" name="Automation" />
  </v-container>
</template>

<script>

import { mapIpcs } from "../utils/ipcMap";
import FileTable from "../components/table/FileTable.vue";

export default {
  components: { FileTable },
  data() {
    return {
      automationFiles: [],
    };
  },
  methods: {
    ...mapIpcs("io", ["getAutomations"]),
    async getFiles() {
      this.automationFiles = await this.getAutomations()
    },
  },
  async mounted() {
    await this.getFiles();
  },
};
</script>
