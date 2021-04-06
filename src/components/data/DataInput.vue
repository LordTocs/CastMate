<template>
  <number-input
    :value="value"
    @input="(v) => $emit('input', v)"
    v-if="schema.type == 'Number' || schema.type == 'TemplateNumber'"
    :allowTemplate="schema.type == 'TemplateNumber'"
    :label="schema.name || label"
  />
  <v-text-field
    :value="value"
    @input="(v) => $emit('input', v)"
    v-else-if="schema.type == 'String' || schema.type == 'TemplateString'"
    :label="schema.name || label"
  />
  <v-switch
    :value="value"
    @change="(v) => $emit('input', v)"
    v-else-if="schema.type == 'Boolean'"
  />
  <v-select
    :value="value"
    @change="(v) => $emit('input', v)"
    :items="[
      { name: 'On', value: true },
      { name: 'Off', value: false },
      { name: 'unset', value: undefined },
    ]"
    item-text="name"
    item-value="value"
    v-else-if="schema.type == 'OptionalBoolean'"
  />
  <object-editor
    :schema="schema.properties"
    :value="value"
    @input="(v) => $emit('input', v)"
    v-else-if="schema.type == 'Object' && schema.properties"
  />
</template>

<script>
import NumberInput from "./NumberInput.vue";
export default {
  name: "data-input",
  components: {
    ObjectEditor: () => import("./ObjectEditor.vue"),
    NumberInput,
    //FreeObjectEditor: () => import("./FreeObjectEditor.vue"),
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