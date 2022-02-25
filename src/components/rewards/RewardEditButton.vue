<template>
  <v-btn fab small class="mx-1" :disabled="!reward" @click.stop="$refs.editModal.open()">
    <v-icon small> mdi-pencil </v-icon>
    <reward-edit-modal :reward="reward" ref="editModal" @rename="v => $emit('rename', v)" :showDelete="false" />
  </v-btn>
</template>

<script>
import { mapGetters } from "vuex";
import RewardEditModal from "./RewardEditModal.vue";
export default {
  components: { RewardEditModal },
  props: {
    rewardName: {},
  },
  computed: {
    ...mapGetters("rewards", ["rewards"]),
    reward() {
      return this.rewards.find((r) => r.name == this.rewardName);
    },
  },
};
</script>

<style>
</style>