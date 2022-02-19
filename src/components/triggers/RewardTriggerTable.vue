<template>
  <trigger-table
    :trigger="trigger"
    :triggerKey="triggerKey"
    :value="value"
    @input="(v) => $emit('input', v)"
  >
    <template v-slot:label="labelProps">
      {{ labelProps.item.key }}
      <reward-edit-button
        :rewardName="labelProps.item.key"
        @rename="(name) => renameCommand(labelProps.item.key, name)"
      />
    </template>
    <template v-slot:selector="selectProps">
      <reward-selector
        :value="selectProps.value"
        @input="selectProps.valueInput"
        label="Reward"
        :existingRewards="existingRewards.filter(r => r != selectProps.item.key)"
      />
    </template>
    <template v-slot:new-selector="selectProps">
      <reward-selector
        :value="selectProps.value"
        @input="selectProps.valueInput"
        :label="selectProps.label"
        :existingRewards="existingRewards"
      />
    </template>
  </trigger-table>
</template>

<script>
import RewardEditButton from "../rewards/RewardEditButton.vue";
import RewardSelector from "../rewards/RewardSelector.vue";
import TriggerTable from "./TriggerTable.vue";
import { changeObjectKey } from "../../utils/objects";

export default {
  components: { TriggerTable, RewardSelector, RewardEditButton },
  props: {
    trigger: {},
    triggerKey: { type: String },
    value: {},
  },
  computed: {
    existingRewards() {
      return Object.keys(this.value);
    },
  },
  methods: {
    renameCommand(oldKey, newKey) {
      console.log("Renaming Command", oldKey, newKey);
      const result = changeObjectKey(this.value, oldKey, newKey);
      this.$emit("input", result);
    },
  },
};
</script>

<style>
</style>