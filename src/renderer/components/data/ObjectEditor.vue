<template>
  <div>
    <data-input
      v-for="propertyKey in Object.keys(schema)"
      :key="propertyKey"
      :schema="schema[propertyKey]"
      :value="value ? value[propertyKey] : null"
      @input="(v) => updateObject(propertyKey, v)"
      :context="context"
    />
  </div>
</template>

<script>
export default {
  name: "object-editor",
  components: { DataInput: () => import("./DataInput.vue") },
  props: {
    value: {},
    schema: {},
    context: {},
  },
  methods: {
    updateObject(key, value) {
      let newValue = this.value ? { ...this.value } : {};

      if (value !== "" && value !== undefined) {
        newValue[key] = value;
      } else {
        console.log("Deleting Key", key);
        delete newValue[key];
      }

      this.$emit("input", newValue);
    },
  },
};
</script>

<style scoped>
.object-row {
  flex: 1;
}
</style>