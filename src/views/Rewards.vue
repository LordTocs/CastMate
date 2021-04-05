<template>
  <v-row dense>
    <v-col
      v-for="reward in rewards"
      :key="reward.name"
    >
      <reward-card :reward="reward" />
    </v-col>
  </v-row>
</template>

<script>
import { mapGetters } from "vuex";
export default {
  components: {
    RewardCard: () => import("../components/rewards/RewardCard.vue"),
  },
  computed: {
    ...mapGetters("rewards", ["rewards"]),
  },
};
</script>

<style>
</style>