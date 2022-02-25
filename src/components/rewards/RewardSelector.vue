<template>
  <v-card-actions>
    <v-combobox
      :value="value"
      :items="items"
      :label="label"
      :search-input.sync="search"
      @input="(v) => $emit('input', v)"
      @change="(v) => $emit('change', v)"
      clearable
    />
    <reward-edit-button
      :rewardName="value"
      @rename="(name) => $emit('input', name)"
    />
    <v-btn fab small class="mx-1" :disabled="!!value" @click.stop="$refs.createModal.open()">
      <v-icon> mdi-plus </v-icon>
    </v-btn>

    <reward-edit-modal
      ref="createModal"
      title="Create Channel Point Reward"
      :showSave="false"
      :showCreate="true"
      :showDelete="false"
      @created="(v) => $emit('input', v)"
    />
  </v-card-actions>
</template>

<script>
import { mapGetters } from "vuex";
import RewardEditButton from "./RewardEditButton.vue";
import RewardEditModal from "./RewardEditModal.vue";

export default {
  components: { RewardEditButton, RewardEditModal },
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
  methods: {
    filterRewards(query) {
      let result = this.rewards.map((r) => r.name);

      result = result.filter((reward) => !this.existingRewards.includes(reward));

      if (query) {
        result = result.filter((a) => a.toLowerCase().includes(query.toLowerCase()));
      }

      this.items = result;
    },
  },
  mounted() {
    this.filterRewards();
  },
  watch: {
    async search(newSearch) {
      await this.filterRewards(newSearch);
    },
  },
};
</script>

<style>
</style>