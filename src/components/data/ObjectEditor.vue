<template>
  <v-row>
    <v-col
      cols="12"
      md="3"
      v-for="propertyKey in Object.keys(schema)"
      :key="propertyKey"
    >
      <data-input
        :schema="schema[propertyKey]"
        :value="value ? value[propertyKey] : null"
        @input="(v) => updateObject(propertyKey, v)"
      />
    </v-col>
  </v-row>
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
</style>