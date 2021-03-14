<template>
  <el-form-item v-if="schema.type == 'Number'" :label="schema.name">
    <el-input-number v-model="value" />
  </el-form-item>
  <el-form-item
    v-else-if="
      schema.type == 'String' ||
      schema.type == 'TemplateString' ||
      schema.type == 'NumberTemplate'
    "
    :label="schema.name"
  >
    <el-input v-model="value" />
  </el-form-item>
  <object-editor
    v-else-if="schema.type == 'Object' && schema.properties"
    :schema="schema.properties"
    v-model="value"
  />
  <free-object-editor
    v-else-if="schema.type == 'Object' && !schema.properties"
    v-model="value"
  />
</template>

<script>
export default {
  name: "data-input",
  components: {
    ObjectEditor: () => import("./ObjectEditor.vue"),
    FreeObjectEditor: () => import("./FreeObjectEditor.vue"),
  },
  props: {
    schema: {},
    value: {},
  },
};
</script>

<style>
</style>