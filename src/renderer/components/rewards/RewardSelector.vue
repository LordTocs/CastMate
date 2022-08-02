<template>
  <v-card-actions>
    <v-combobox
      v-model="modelObj"
      :items="items"
      :label="label"
      :search-input.sync="search"
      clearable
    />
    <v-menu bottom right>
      <template v-slot:activator="{ props }">
        <v-btn dark icon v-bind="props">
          <v-icon>mdi-dots-vertical</v-icon>
        </v-btn>
      </template>

      <v-list>
        <v-list-item link :disabled="!value">
          <v-list-item-title @click="$refs.editModal.open()">
            Edit Reward
          </v-list-item-title>
        </v-list-item>
        <v-list-item @click="$refs.createModal.open()" link :disabled="!!value">
          <v-list-item-title> Create New Reward </v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>

    <reward-edit-modal
      ref="editModal"
      title="Edit Channel Point Reward"
      :reward="currentReward"
      @rename="(v) => $emit('input', v)"
      :showDelete="false"
    />

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
import { mapModel } from "../../utils/modelValue";
import RewardEditButton from "./RewardEditButton.vue";
import RewardEditModal from "./RewardEditModal.vue";

export default {
  components: { RewardEditButton, RewardEditModal },
  props: {
    modelValue: {},
    label: { type: String, default: () => "Channel Point Reward" },
    existingRewards: { type: Array, default: () => [] },
  },
  computed: {
    ...mapGetters("rewards", ["rewards"]),
    ...mapModel(),
    currentReward() {
      return this.rewards.find((r) => r.name == this.modelValue);
    },
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

      result = result.filter(
        (reward) => !this.existingRewards.includes(reward)
      );

      if (query) {
        result = result.filter((a) =>
          a.toLowerCase().includes(query.toLowerCase())
        );
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