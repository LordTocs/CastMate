<template>
  <v-card-actions>
    <v-combobox
      :value="value"
      @change="(v) => $emit('change', v)"
      :loading="isLoading"
      :search-input.sync="search"
      :items="automations"
      label="Automation"
      clearable
    />
    <v-btn
      fab
      small
      class="mx-1"
      as="router-link"
      :to="`/automations/${value}`"
      :disabled="!value"
    >
      <v-icon small> mdi-pencil </v-icon>
    </v-btn>
    <v-btn
      fab
      small
      class="mx-1"
      @click="$refs.addModal.open()"
      :disabled="!!value"
    >
      <v-icon small> mdi-plus </v-icon>
    </v-btn>
    <named-item-modal
      ref="addModal"
      header="Create New Automation"
      label="Name"
      @created="createNewAutomation"
    />
  </v-card-actions>
</template>

<script>
import { mapIpcs } from "../../utils/ipcMap";
import fs from "fs";
import path from "path";
import YAML from "yaml";
import { mapGetters } from "vuex";
import NamedItemModal from "../dialogs/NamedItemModal.vue";

export default {
  props: {
    value: {},
  },
  components: {
    NamedItemModal,
  },
  computed: {
    ...mapGetters("ipc", ["paths"]),
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

      const automation = {
        description: "",
        actions: [],
      };

      await fs.promises.writeFile(filePath, YAML.stringify(automation));

      this.$emit("change", name);

      await this.refreshAutomations();
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