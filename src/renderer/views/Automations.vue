<template>
  <v-container fluid>
    <v-card class="linktable-card" color="grey darken-2">
      <v-card-title>
        <v-btn @click="$refs.addAutomationModal.open()" class="mx-3"> Add Automation </v-btn>
        <v-text-field
          v-model="search"
          append-icon="mdi-magnify"
          class="my-0 py-0"
          label="Filter"
          single-line
          hide-details
        />
      </v-card-title>
      <v-data-table
        :headers="automationHeaders"
        :items="automationFiles"
        :search="search"
        :items-per-page="-1"
        @click:row="(item) => $router.push(`/automations/${item.name}`)"
      >
        <template v-slot:item.actions="{ item }">
          <!--v-btn fab small class="mx-1">
            <v-icon small> mdi-pencil </v-icon>
          </v-btn-->
          <v-btn fab small class="mx-1" @click.stop="tryDelete(item.name)">
            <v-icon small> mdi-delete </v-icon>
          </v-btn>
          <v-btn fab small class="mx-1" @click.stop="tryDuplicate(item.name)">
            <v-icon small> mdi-content-copy </v-icon>
          </v-btn>
          <v-btn fab small class="mx-1" @click.stop="tryRename(item.name)">
            <v-icon small> mdi-pencil </v-icon>
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
        label="Name"
        @created="createNewAutomation"
      />
      <confirm-dialog ref="deleteDlg" />
      <named-item-confirmation ref="duplicateDlg" />
    </v-card>
  </v-container>
</template>

<script>
import fs from "fs";
import path from "path";
import YAML from "yaml";
import { mapGetters } from "vuex";
import ConfirmDialog from "../components/dialogs/ConfirmDialog.vue";
import NamedItemModal from "../components/dialogs/NamedItemModal.vue";
import NamedItemConfirmation from "../components/dialogs/NamedItemConfirmation.vue";
import {
  createNewAutomation,
  deleteAutomation,
  duplicateAutomation,
  getAllAutomations,
  renameAutomation,
} from "../utils/fileTools";

export default {
  components: { ConfirmDialog, NamedItemModal, NamedItemConfirmation },
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
      const automations = await getAllAutomations();
      this.automationFiles = automations.map((f) => ({
        name: f,
      }));
    },
    async createNewAutomation(name) {
      await createNewAutomation(name);
      this.$router.push(`/automations/${name}`);
    },
    async tryDelete(name) {
      if (
        await this.$refs.deleteDlg.open(
          "Confirm",
          `Are you sure you want to delete ${name}?`
        )
      ) {
        await deleteAutomation(name);

        const idx = this.automationFiles.findIndex((af) => af.name == name);

        if (idx != -1) {
          this.automationFiles.splice(idx, 1);
        }
      }
    },
    async tryDuplicate(name) {
      if (
        await this.$refs.duplicateDlg.open(
          `Duplicate ${name}?`,
          `New Automation Name`,
          "Duplicate",
          "Cancel"
        )
      ) {
        const newName = this.$refs.duplicateDlg.name;
        await duplicateAutomation(name, newName);

        this.$router.push(`/automations/${newName}`);
      }
    },
    async tryRename(name) {
      if (
        await this.$refs.duplicateDlg.open(
          `Rename ${name}?`,
          `New Automation Name`,
          "Rename",
          "Cancel"
        )
      ) {
        const newName = this.$refs.duplicateDlg.name;
        await renameAutomation(name, newName);

        await this.getFiles();
      }
    },
  },

  data() {
    return {
      search: "",
      automationFiles: [],
    };
  },
  async mounted() {
    await this.getFiles();
  },
};
</script>

<style>
.linktable-card tbody tr {
  cursor: pointer;
}

.linktable-card tbody tr:nth-of-type(even) {
  background-color: #424242;
}

.linktable-card tbody tr:nth-of-type(odd) {
  background-color: #424242;
}

.linktable-card .v-data-table-header {
  background-color: #424242;
  color: white;
}

.linktable-card .v-data-footer {
  background-color: #424242;
}
</style>