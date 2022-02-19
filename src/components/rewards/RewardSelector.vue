<template>
  <v-card-actions>
    <v-combobox
      :value="value"
      :items="items"
      :label="label"
      :search-input.sync="search"
      @input="(v) => $emit('input', v)"
      @change="(v) => $emit('change', v)"
      :clearable="clearable"
    />
  </v-card-actions>
</template>

<script>
import { mapGetters } from "vuex";

export default {
  props: {
    value: {},
    label: { type: String, default: () => "Channel Point Reward" },
    existingRewards: { type: Array, default: () => [] },
  },
  computed: {
    ...mapGetters("rewards", ["rewards"]),
  },
  data() {
    return {
      items: [],
      search: null,
    };
  },
  method: {
    filterRewards(query) {
      const result = [...this.rewards];

      result.filter((k) => !this.existingRewards.includes(k.name));

      if (query) {
        result.filter((a) => a.toLowerCase().includes(name.toLowerCase()));
      }

      this.items = result;
    },
  },
  mounted() {
    filterRewards();
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