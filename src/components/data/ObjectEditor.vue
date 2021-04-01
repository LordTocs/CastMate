<template>
  <el-card shadow="never" class="object-indent">
    <table>
      <data-input
        v-for="propertyKey in Object.keys(schema)"
        :key="propertyKey"
        :schema="schema[propertyKey]"
        :value="value ? value[propertyKey] : null"
        @input="(v) => updateObject(propertyKey, v)"
      />
    </table>
  </el-card>
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