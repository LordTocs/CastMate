<template>
  <v-autocomplete
    :value="value"
    @change="(v) => $emit('change', v)"
    :loading="isLoading"
    :search-input.sync="search"
    :items="automations"
    item-value="id"
    item-text="name"
    label="Automation"
  >
  </v-autocomplete>
</template>

<script>
import { mapIpcs } from "../../utils/ipcMap";

export default {
  props: {
    value: {},
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
    async filterAutomations(name) {
      const automations = await this.getAutomations();

      automations.filter((a) => a.toLowerCase().includes(name.toLowerCase()));

      this.automations = automations.map((a) => ({
        name: a,
      }));
    },
  },
  async mounted() {
    const automations = await this.getAutomations();
    this.automations = automations.map((a) => ({
      name: a,
    }));
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