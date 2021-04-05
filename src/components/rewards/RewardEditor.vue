<template>
  <div>
    <v-text-field
      label="Description"
      :value="value.description"
      @input="(v) => setSubValue('description', v)"
    />

    <v-text-field
      label="Cost"
      type="number"
      :value="value.cost"
      @input="(v) => setSubValue('cost', v)"
    />

    <v-text-field
      label="Cooldown"
      type="number"
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

    <v-text-field
      label="Max Redemptions Per Stream"
      type="number"
      :value="value.maxRedemptionsPerStream"
      @input="(v) => setSubValue('maxRedemptionsPerStream', v)"
    />

    <v-text-field
      label="Max Redemptions Per User Per Stream"
      type="number"
      :value="value.maxRedemptionsPerUserPerStream"
      @input="(v) => setSubValue('maxRedemptionsPerUserPerStream', v)"
    />
  </div>
</template>

<script>
export default {
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