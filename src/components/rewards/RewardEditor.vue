<template>
  <div>
    <v-text-field
      label="Name"
      :value="value.name"
      @input="(v) => setSubValue('name', v)"
    />

    <v-text-field
      label="Description"
      :value="value.description"
      @input="(v) => setSubValue('description', v)"
    />

    <number-input
      label="Cost"
      :value="value.cost"
      @input="(v) => setSubValue('cost', v)"
    />

    <number-input
      label="Cooldown"
      :value="value.cooldown"
      @input="(v) => setSubValue('cooldown', v)"
    />

    <v-switch
      label="Requires Message"
      :input-value="value.inputRequired"
      @change="(v) => setSubValue('inputRequired', v)"
    />

    <v-switch
      label="Skip Queue"
      :input-value="value.skipQueue"
      @change="(v) => setSubValue('skipQueue', v)"
      hide-details
    />

    <number-input
      label="Max Redemptions Per Stream"
      :value="value.maxRedemptionsPerStream"
      @input="(v) => setSubValue('maxRedemptionsPerStream', v)"
    />

    <number-input
      label="Max Redemptions Per User Per Stream"
      :value="value.maxRedemptionsPerUserPerStream"
      @input="(v) => setSubValue('maxRedemptionsPerUserPerStream', v)"
    />
  </div>
</template>

<script>
import NumberInput from "../data/NumberInput.vue";

export default {
  components: { NumberInput },
  props: {
    value: {},
  },
  methods: {
    setSubValue(key, value) {
      let newValue = { ...this.value };

      if (value !== undefined && value !== "") {
        newValue[key] = value;
      } else {
        delete newValue[key];
      }

      this.$emit("input", newValue);
    },
  },
};
</script>

<style>
</style>