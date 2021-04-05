<template>
  <div style="text-align: left">
    <v-expansion-panels multiple class="mb-6">
      <key-card
        v-for="rewardKey in Object.keys(rewards)"
        :key="rewardKey"
        :keyValue="rewardKey"
        @updatekey="(newKey) => updateRewardKey(rewardKey, newKey)"
        @delete="deleteReward(rewardKey)"
      >
        <reward-editor
          :value="rewards[rewardKey]"
          @input="(v) => updateReward(rewardKey, v)"
        />
      </key-card>
    </v-expansion-panels>


    <el-button @click="newReward"> New Reward </el-button>
  </div>
</template>

<script>
import RewardEditor from "../components/rewards/RewardEditor.vue";
import { changeObjectKey } from "../utils/objects";
import fs from "fs";
import YAML from "yaml";
export default {
  components: {
    RewardEditor,
    KeyCard: () => import("../components/data/KeyCard.vue"),
  },
  data() {
    return {
      rewards: {},
    };
  },
  methods: {
    updateReward(key, value) {
      this.$set(this.rewards, key, value);
    },
    updateRewardKey(oldKey, newKey) {
      let newRewards = changeObjectKey(this.rewards, oldKey, newKey);

      this.rewards = newRewards;
    },
    deleteReward(key) {
      this.$delete(this.rewards, key);
    },
    newReward() {
      this.$set(this.rewards, "", {});
    },
    async save() {
      let newYaml = YAML.stringify(this.rewards);

      await fs.promises.writeFile("./user/rewards.yaml", newYaml);

      this.$message({
        showClose: true,
        message: "Saved.",
        type: "success",
      });
    },
  },
  async mounted() {
    let rewardsText = await fs.promises.readFile(
      "./user/rewards.yaml",
      "utf-8"
    );

    let rewardsObj = YAML.parse(rewardsText) || {};

    this.$set(this, "rewards", rewardsObj);
  },
};
</script>

<style>
</style>