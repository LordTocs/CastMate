<template>
  <div class="data-object-container">
    <data-input
      v-for="propertyKey in Object.keys(schema)"
      :key="propertyKey"
      :schema="schema[propertyKey]"
      :value="value ? value[propertyKey] : null"
      @input="(v) => updateObject(propertyKey, v)"
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
  },
  methods: {
    updateObject(key, value) {
      let newValue = this.value ? { ...this.value } : {};

      if (value != "" && value != undefined) {
        console.log("Update Obj", key, value);
        newValue[key] = value;
      } else {
        delete newValue[key];
      }

      this.$emit("input", newValue);
    },
  },
};
</script>

<style scoped>
.data-object-container {
  padding-left: 3rem;
}
</style>