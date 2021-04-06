<template>
  <v-container fluid>
    <v-row>
      <v-col
        v-for="reward in rewards"
        :key="reward.name"
        cols="12"
        xl="3"
        lg="4"
        md="6"
        sm="12"
      >
        <reward-card :reward="reward" />
      </v-col>
    </v-row>
    <reward-edit-modal
      ref="createModal"
      title="Create Channel Point Reward"
      :showSave="false"
      :showCreate="true"
      :showDelete="false"
    />
    <v-fab-transition>
      <v-btn
        color="primary"
        fixed
        fab
        large
        right
        bottom
        @click="$refs.createModal.open()"
      >
        <v-icon> mdi-plus </v-icon>
      </v-btn>
    </v-fab-transition>
  </v-container>
</template>

<script>
import RewardEditModal from "../components/rewards/RewardEditModal.vue";
import { mapGetters } from "vuex";
export default {
  components: {
    RewardEditModal,
    RewardCard: () => import("../components/rewards/RewardCard.vue"),
  },
  computed: {
    ...mapGetters("rewards", ["rewards"]),
  },
};
</script>

<style>
</style>