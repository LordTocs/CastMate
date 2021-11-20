<template>
  <number-input
    :value="value"
    @input="(v) => $emit('input', v)"
    v-if="schema.type == 'Number' && !schema.slider"
    :allowTemplate="!!schema.template"
    :label="schema.name || label"
  />
  <v-slider
    v-else-if="schema.type == 'Number' && schema.slider"
    :label="schema.name || label"
    :value="value"
    :min="schema.slider[0]"
    :max="schema.slider[1]"
    :step="0"
	color="white"
    @input="(v) => $emit('input', v)"
  />
  <string-data-input
    :value="value"
    @input="(v) => $emit('input', v)"
    v-else-if="schema.type == 'String'"
    :dataName="schema.name || label"
    :schema="schema"
  />
  <v-switch
    :value="value"
    @change="(v) => $emit('input', v)"
    v-else-if="schema.type == 'Boolean'"
    :label="schema.name || label"
  />
  <v-select
    :value="value"
    :label="schema.name || label"
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
  <file-autocomplete
    v-else-if="schema.type == 'FilePath'"
    :value="value"
    @change="(v) => $emit('input', v)"
    :recursive="!!schema.recursive"
    :path="schema.path"
    :basePath="schema.basePath"
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
import FileAutocomplete from "./FileAutocomplete.vue";
import StringDataInput from "./StringDataInput.vue";

export default {
  name: "data-input",
  components: {
    ObjectEditor: () => import("./ObjectEditor.vue"),
    NumberInput,
    FileAutocomplete,
    StringDataInput,
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