<template>
  <v-container fluid>
    <v-row>
      <v-col v-for="reward in rewards" :key="reward.name" cols="12" xl="3" lg="4" md="6" sm="12">
        <reward-card :reward="reward" />
      </v-col>
    </v-row>
  </v-container>
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