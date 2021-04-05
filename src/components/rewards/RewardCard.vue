<template>
  <v-card class="mx-auto" max-width="400" min-width="300">
    <v-card-title> {{ reward.name }} </v-card-title>
    <v-card-subtitle> {{ reward.description }} </v-card-subtitle>

    <v-card-actions>
      <v-spacer></v-spacer>

      <v-btn icon @click="show = !show">
        <v-icon>{{ show ? "mdi-cancel" : "mdi-pencil" }}</v-icon>
      </v-btn>
    </v-card-actions>
    <v-expand-transition>
      <div v-show="show">
        <v-divider></v-divider>

        <v-card-text>
          <reward-editor
            :value="reward"
            @input="(v) => triggerRewardUpdate(v)"
            @delete="deleteMe"
          />
        </v-card-text>
      </div>
    </v-expand-transition>
  </v-card>
</template>

<script>
import { mapActions } from "vuex";
import RewardEditor from "./RewardEditor.vue";
export default {
  components: { RewardEditor },
  props: {
    reward: {},
  },
  data() {
    return {
      show: false,
    };
  },
  methods: {
    ...mapActions("rewards", ["updateReward", "deleteReward"]),
    async triggerRewardUpdate(newReward) {
      await this.updateReward({ rewardName: this.reward.name, newReward });
    },
    async deleteMe() {
      await this.deleteReward(this.reward.name);
    },
  },
};
</script>

<style>
</style>