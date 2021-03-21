<template>
  <div class="input-row" v-if="schema.type == 'Number'">
    <label class="object-label"> {{ schema.name || label }} </label>
    <el-input-number v-model="value" />
  </div>
  <div
    class="input-row"
    v-else-if="
      schema.type == 'String' ||
      schema.type == 'TemplateString' ||
      schema.type == 'NumberTemplate'
    "
  >
    <label class="object-label"> {{ schema.name || label }} </label>
    <el-input v-model="value" />
  </div>
  <div v-else-if="schema.type == 'Object' && schema.properties">
    <label class="object-label"> {{ schema.name || label }} </label>
    <object-editor :schema="schema.properties" v-model="value" />
  </div>
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
    label: {},
  },
};
</script>

<style>
.object-label {
  font-size: 14px;
  color: #606266;
  line-height: 32px;
  display: inline-block;
  width: 5rem;
  text-align: right;
  padding-right: 0.5rem;
}

.input-row {
  display: flex;
  flex-direction: row;
}

.input-row:not(:last-child) {
  margin-bottom: 0.35rem;
}
</style>