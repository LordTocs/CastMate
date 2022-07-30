<template>
  <div>
    <v-text-field
      label="Name"
      v-model="name"
    />
    <v-text-field
      label="Description"
      v-model="description"
    />
    <number-input
      label="Cost"
      v-model="cost"
    />
    <number-input
      label="Cooldown"
      v-model="cooldown"
    />
    <v-switch
      label="Requires Message"
      v-model="inputRequired"
    />
    <v-switch
      label="Skip Queue"
      v-model="skipQueue"
      hide-details
    />
    <number-input
      label="Max Redemptions Per Stream"
      v-model="maxRedemptionsPerStream"
    />
    <number-input
      label="Max Redemptions Per User Per Stream"
      v-model="maxRedemptionsPerUserPerStream"
    />
  </div>
</template>

<script>
import { mapModelValues } from "../../utils/modelValue";
import NumberInput from "../data/types/NumberInput.vue";

export default {
  components: { NumberInput },
  props: {
    value: {},
  },
  computed: {
    ...mapModelValues(["name", "description", "cooldown", "inputRequired", "skipQueue", "maxRedemptionsPerStream", "maxRedemptionsPerUserPerStream"])
  }
};
</script>

<style>
</style>