<template>
  <div class="d-flex flex-row">
    <v-combobox
      v-model="modelObj"
      :loading="isLoading"
      :search-input.sync="search"
      :items="automations"
      :label="label"
      clearable
    >
      <template v-slot:selection="{ item }">
        <v-chip
          class="ma-2"
          color="red"
          text-color="white"
          v-if="!hasAutomation(item)"
        >
          MISSING
        </v-chip>
        <span>{{ item }} </span>
      </template>
    </v-combobox>
    <v-btn
      fab
      small
      class="mx-1"
      v-if="showButtons"
      @click.stop="$refs.automationDlg.open()"
      :disabled="!value"
    >
      <v-icon small> mdi-pencil </v-icon>
    </v-btn>
    <v-btn
      fab
      small
      class="mx-1"
      v-if="showButtons"
      @click="$refs.addModal.open()"
      :disabled="!!value"
    >
      <v-icon small> mdi-plus </v-icon>
    </v-btn>
    <automation-quick-edit-dialog ref="automationDlg" :automationName="value" />
    <named-item-modal
      ref="addModal"
      header="Create New Automation"
      label="Name"
      @created="createNewAutomation"
    />
  </div>
</template>

<script>
import { mapIpcs } from "../../utils/ipcMap";
import fs from "fs";
import path from "path";
import YAML from "yaml";
import { mapGetters } from "vuex";
import NamedItemModal from "../dialogs/NamedItemModal.vue";
import AutomationQuickEditDialog from "./AutomationQuickEditDialog.vue";
import { trackAnalytic } from "../../utils/analytics.js";
import { mapModel } from "../../utils/modelValue";

export default {
  name: "automation-selector",
  props: {
    modelValue: {},
    label: { type: String, default: () => "Automation" },
    showButtons: { type: Boolean, default: () => true },
  },
  components: {
    NamedItemModal,
    AutomationQuickEditDialog,
  },
  computed: {
    ...mapGetters("ipc", ["paths"]),
    ...mapModel()
  },
  data() {
    return {
      isLoading: false,
      search: null,
      automations: [],
    };
  },
  methods: {
    ...mapIpcs("core", ["getAutomations"]),
    async refreshAutomations() {
      this.automations = await this.getAutomations();
    },
    async filterAutomations(name) {
      const automations = await this.getAutomations();

      if (name) {
        automations.filter((a) => a.toLowerCase().includes(name.toLowerCase()));
      }

      this.automations = automations;
    },
    async createNewAutomation(name) {
      const filePath = path.join(
        this.paths.userFolder,
        "automations",
        name + ".yaml"
      );

      if (fs.existsSync(filePath)) {
        return;
      }

      //TODO: Remove duplication!!
      const automation = {
        version: "1.0",
        description: "",
        actions: [],
      };

      trackAnalytic("newAutomation", { name });

      await fs.promises.writeFile(filePath, YAML.stringify(automation));

      this.$emit("input", name);

      setTimeout(async () => {
        await this.refreshAutomations();
      }, 1000);
    },
    hasAutomation(automation) {
      return this.automations.includes(automation);
    },
  },
  async mounted() {
    this.refreshAutomations();
  },
  watch: {
    async search(newSearch) {
      await this.filterAutomations(newSearch);
    },
  },
};
</script>

<style>
</style>