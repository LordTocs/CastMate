<template>
  <data-input
    v-for="propertyKey in Object.keys(schema)"
    :key="propertyKey"
    :schema="schema[propertyKey]"
    :model-value="modelValue ? modelValue[propertyKey] : null"
    @update:model-value="(v) => updateObject(propertyKey, v)"
    :context="context"
    :secret="secret"
    :colorRefs="colorRefs"
  />
</template>

<script>
import { defineAsyncComponent } from 'vue'

export default {
  name: "object-input",
  components: { DataInput: defineAsyncComponent(() => import("../DataInput.vue")) },
  props: {
    modelValue: {},
    schema: {},
    context: {},
    colorRefs: {},
    secret: { type: Boolean, default: () => false }
  },
  methods: {
    updateObject(key, value) {
      let newValue = this.modelValue ? { ...this.modelValue } : {};

      if (value !== "" && value !== undefined) {
        newValue[key] = value;
      } else {
        console.log("Deleting Key", key);
        delete newValue[key];
      }

      this.$emit("update:modelValue", newValue);
    },
  },
};
</script>

<style scoped>
.object-row {
  flex: 1;
}
</style>