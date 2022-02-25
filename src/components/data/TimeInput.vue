<template>
  <v-text-field
    :value="value"
    @change="(v) => $emit('input', v)"
    placeholder="00:00 - 23:59"
    :label="label"
    v-mask="timeMask"
  />
</template>

<script>
export default {
  props: {
    value: {},
    label: { type: String, default: () => "Time" },
  },
  methods: {
    /**
     * Generate a time mask based on input value (000:00:00)
     * @param {string} value
     */
    timeMask(value) {
      const toSixty = [/[0-5]/, /[0-9]/];
      if (value.length <= 2) return toSixty;
      if (value.length <= 5) return [...toSixty, ":", ...toSixty];
      return [/\d*/, ":", ...toSixty, ":", ...toSixty];
    },
  },
};
</script>

<style>
</style>