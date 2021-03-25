<template>
  <el-select
    :value="null"
    placeholder="Select Reward"
    @input="(v) => $emit('input', v)"
  >
    <el-option
      v-for="reward in remainingRewards"
      :key="reward"
      :label="reward"
      :value="reward"
    >
    </el-option>
  </el-select>
</template>

<script>
import { mapGetters } from "vuex";
import fs from "fs";
import YAML from "yaml";
export default {
  props: {
    rewards: {},
  },
  methods: {
    getRewards() {
      let rewards = YAML.parse(fs.readFileSync("./user/rewards.yaml", "utf-8"));

      return Object.keys(rewards);
    },
  },
  computed: {
    ...mapGetters("ipc", ["triggers"]),
    remainingRewards() {
      let filterRewards = this.rewards || [];
      return this.getRewards().filter((k) => !filterRewards.includes(k));
    },
  },
};
</script>

<style>
</style>