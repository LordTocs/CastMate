<template>
  <v-container fluid>
    <v-card color="grey darken-2">
      <v-card-title>
        <v-text-field
          v-model="search"
          append-icon="mdi-magnify"
          label="Filter"
          single-line
          hide-details
        />
      </v-card-title>
      <v-data-table :headers="automationHeaders" :items="automationFiles">
        <template v-slot:item.actions>
          <v-btn fab small class="mx-1">
            <v-icon small> mdi-pencil </v-icon>
          </v-btn>
          <v-btn fab small class="mx-1" @click="tryDelete(item.key)">
            <v-icon small> mdi-delete </v-icon>
          </v-btn>
        </template>

        <template v-slot:footer.prepend>
          <v-btn @click="$refs.addAutomationModal.open()">
            Add Automation
          </v-btn>
        </template>
      </v-data-table>
      <named-item-modal
        ref="addAutomationModal"
        header="Create New Automation"
        label="Automation"
      />
      <confirm-dialog ref="deleteDlg" />
    </v-card>
  </v-container>
</template>

<script>
import fs from "fs";
import path from "path";
import YAML from "yaml";
import { mapGetters } from "vuex";

export default {
  computed: {
    ...mapGetters("ipc", ["inited", "paths"]),
    automationHeaders() {
      return [
        { text: "Automation Name", value: "name" },
        { text: "", value: "actions", sortable: false, align: "right" },
      ];
    },
  },
  methods: {
    async getFiles() {
      let automationFiles = await fs.promises.readdir(
        path.join(this.paths.userFolder, "automations")
      );

      automationFiles = automationFiles.filter(
        (f) => path.extname(f) == ".yaml"
      );

      this.automationFiles = automationFiles.map((f) => ({
        name: path.basename(f, ".yaml"),
      }));
    },
  },
  data() {
    return {
      automationFiles: [],
    };
  },
  async mounted() {
    await this.getFiles();
  },
};
</script>

<style>
</style>