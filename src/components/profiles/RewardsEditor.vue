<template>
  <v-card>
    <v-card-title> Profile Rewards </v-card-title>
    <v-card-subtitle>
      These Channel Point Rewards will be active when this profile is active.
    </v-card-subtitle>
    <v-card-text>
      <v-row>
        <v-col v-for="(reward, i) in value" :key="reward" cols="12" xl="3" lg="4" md="6" sm="12">
          <reward-card
            v-if="getReward(reward) != null"
            hasRemove
            :reward="getReward(reward)"
            @remove="deleteReward(i)"
            color="grey darken-3"
          />
          <v-card class="mx-auto" min-width="300" max-width="400" v-else>
            <v-card-title> {{ reward }} </v-card-title>
            <v-card-subtitle> Reward not found! </v-card-subtitle>
            <v-card-actions>
              <v-btn @click="deleteReward(i)"> Remove </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </v-card-text>
    <v-card-actions>
      <add-reward-popover @input="addReward" :existingRewards="value" />
    </v-card-actions>
  </v-card>
</template>

<script>
import { mapGetters } from "vuex";
//import RewardSelector from "@/components/data/RewardSelector.vue";
import RewardCard from "../rewards/RewardCard.vue";
import AddRewardPopover from "./AddRewardPopover.vue";
export default {
  components: {
    RewardCard,
    AddRewardPopover,
  },
  props: {
    value: {},
  },
  computed: {
    ...mapGetters("rewards", ["rewards"]),
  },
  data() {
    return {
      rewardPop: false,
    };
  },
  methods: {
    getReward(name) {
      return this.rewards.find((r) => r.name == name);
    },

    deleteReward(index) {
      let newValue = [...this.value];

      newValue.splice(index, 1);

      this.$emit("input", newValue);
    },

    addReward(newReward) {
      this.rewardPop = false;

      let newValue = [...(this.value ? this.value : [])];

      newValue.push(newReward);

      this.$emit("input", newValue);
    },
  },
};
</script>

<style scoped>
.rewards-editor {
  text-align: left;
}

.reward-row {
  display: flex;
  flex-direction: row;
}
</style>