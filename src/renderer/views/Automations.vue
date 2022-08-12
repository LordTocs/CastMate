<template>
  <v-container fluid>
    <file-table :files="automationFiles" name="Automation" @nav="onNav"/>
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
    onNav(name) {
      console.log("HELLO");
      this.$router.push(`/automations/${name}`)
    }
  },
  async mounted() {
    await this.getFiles();
  },
};
</script>
