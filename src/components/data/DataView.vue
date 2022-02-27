<template>
  <div v-if="!schema || value === undefined" />
  <p
    class="one-text-line"
    v-else-if="
      schema.type == 'String' ||
      schema.type == 'Number' ||
      schema.type == 'Boolean' ||
      schema.type == 'FilePath' ||
      schema.type == 'Automation'
    "
  >
    <span v-if="schema.name || label"> {{ schema.name || label }}: </span>
    {{ value }}
  </p>
  <p v-else-if="schema.type == 'LightColor'">
    <span v-if="schema.name || label"> {{ schema.name || label }}: </span>
    <color-swatch :value="value" />
  </p>
  <div v-else-if="schema.type == 'Object' && schema.properties">
    <data-view
      v-for="key in Object.keys(value)"
      :key="key"
      :schema="schema.properties[key]"
      :value="value[key]"
    />
  </div>
</template>

<script>
import ColorSwatch from "./ColorSwatch.vue";
export default {
  components: { ColorSwatch },
  name: "data-view",
  props: {
    schema: {},
    value: {},
    label: {},
  },
};
</script>

<style scoped>
.one-text-line {
  text-overflow: ellipsis;
}
</style>