<template>
  <v-card class="mx-auto" min-width="300" max-width="400" :color="color">
    <v-card-title> {{ reward.name }} </v-card-title>
    <v-card-subtitle> {{ reward.description }} </v-card-subtitle>

    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn icon v-if="hasRemove" @click="$emit('remove')">
        <v-icon> mdi-cancel </v-icon>
      </v-btn>
      <v-btn icon @click="showEdit">
        <v-icon> mdi-pencil </v-icon>
      </v-btn>
    </v-card-actions>
    <reward-edit-modal :reward="reward" ref="editModal" />
  </v-card>
</template>

<script>
import { mapActions } from "vuex";
import RewardEditModal from "./RewardEditModal.vue";

export default {
  components: { RewardEditModal },
  props: {
    reward: {},
    hasRemove: { type: Boolean, default: () => false },
    color: {},
  },
  methods: {
    ...mapActions("rewards", ["updateReward", "deleteReward"]),
    showEdit() {
      this.$refs.editModal.open();
    },
  },
};
</script>

<style>
</style>