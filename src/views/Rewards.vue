<template>
  <div style="text-align: left">
    <level style="margin-bottom: 18px">
      <div class="left">
        <h1>Channel Point Rewards</h1>
      </div>
      <div class="right">
        <el-button type="success" @click="save" style="width: 120px">
          <h3>Save</h3>
        </el-button>
      </div>
    </level>

    <el-form>
      <el-card
        v-for="rewardKey in Object.keys(rewards)"
        :key="rewardKey"
        style="margin-bottom: 18px"
      >
        <div
          slot="header"
          class="clearfix"
          style="display: flex; flex-direction: row"
        >
          <level>
            <div class="left" style="width: 100%">
              <key-input
                :value="rewardKey"
                @input="(newKey) => updateRewardKey(rewardKey, newKey)"
              />
            </div>
            <div class="right">
              <el-button @click="deleteReward(rewardKey)"> Delete </el-button>
            </div>
          </level>
        </div>
        <reward-editor
          :value="rewards[rewardKey]"
          @input="(v) => updateReward(rewardKey, v)"
        />
      </el-card>
    </el-form>
    <el-button @click="newReward"> New Reward </el-button>
  </div>
</template>

<script>
import RewardEditor from "../components/rewards/RewardEditor.vue";
import { changeObjectKey } from "../utils/objects";
import KeyInput from "../components/data/KeyInput.vue";
import Level from "../components/layout/Level";
import fs from "fs";
import YAML from "yaml";
export default {
  components: { RewardEditor, KeyInput, Level },
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
      this.$set(this.rewards, "", {})
    },
    async save() {
      let newYaml = YAML.stringify(this.rewards);

      await fs.promises.writeFile("./user/rewards.yaml", newYaml);
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