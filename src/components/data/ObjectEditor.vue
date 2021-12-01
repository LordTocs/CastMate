<template>
  <div class="object-row">
    <v-row v-for="propertyKey in Object.keys(schema)" :key="propertyKey">
      <v-col>
        <data-input
          :schema="schema[propertyKey]"
          :value="value ? value[propertyKey] : null"
          @input="(v) => updateObject(propertyKey, v)"
        />
      </v-col>
    </v-row>
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

      if (value !== "" && value !== undefined) {
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
.object-row {
  flex: 1;
}
</style>