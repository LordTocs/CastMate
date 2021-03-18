<template>
  <el-card shadow="never" class="object-indent">
    <data-input
      v-for="propertyKey in Object.keys(schema)"
      :key="propertyKey"
      :schema="schema[propertyKey]"
      v-model="value[propertyKey]"
    />
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
};
</script>

<style scoped>
.object-indent {
  margin-left: 2rem;
}
</style>