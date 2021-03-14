<template>
  <div class="object-indent">
    <data-input
      v-for="propertyKey in Object.keys(schema)"
      :key="propertyKey"
      :schema="schema[propertyKey]"
      v-model="value[propertyKey]"
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
};
</script>

<style scoped>
.object-indent {
  padding-left: 3rem;
}
</style>