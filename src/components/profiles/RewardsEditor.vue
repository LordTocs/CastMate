<template>
  <el-card class="rewards-editor">
    <h3>Rewards</h3>
    <div class="reward-row" v-for="(reward, i) in value" :key="reward">
      <div style="flex: 1">
        {{ reward }}
      </div>
      <div style="flex: 0; margin-bottom: 18px; margin-left: 5px">
        <el-button @click="deleteReward(i)" icon="el-icon-delete" />
      </div>
    </div>
    <el-popover v-model="rewardPop" placement="top">
      <reward-selector @input="addReward" :rewards="value" />
      <el-button slot="reference"> Add Reward </el-button>
    </el-popover>
  </el-card>
</template>

<script>
import RewardSelector from "@/components/data/RewardSelector.vue";
export default {
  props: {
    value: {},
  },
  components: {
    RewardSelector,
  },
  data() {
    return {
      rewardPop: false,
    };
  },
  methods: {
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