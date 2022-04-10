<template>
  <object-editor
    :schema="schema.properties"
    :value="value"
    @input="handleInput"
    v-if="schema.type == 'Object' && schema.properties"
    :context="context"
    :secret="secret"
  />
  <number-input
    :value="value"
    @input="handleInput"
    v-else-if="schema.type == 'Number' && !schema.slider"
    :allowTemplate="!!schema.template"
    :label="schema.name || label"
    :clearable="!schema.required"
    :secret="secret"
  />

  <v-slider
    v-else-if="schema.type == 'Number' && schema.slider"
    :label="schema.name || label"
    :value="value"
    :min="schema.slider.min"
    :max="schema.slider.max"
    :step="schema.slider.step"
    color="white"
    @input="handleInput"
    :append-icon="!schema.required ? 'mdi-close' : undefined"
    @click:append="$emit('input', undefined)"
  />
  <string-data-input
    :value="value"
    @input="handleInput"
    v-else-if="schema.type == 'String'"
    :dataName="schema.name || label"
    :schema="schema"
    :context="context"
    :secret="secret"
  />
  <div v-else-if="schema.type == 'Boolean'" class="d-flex flex-row">
    <div v-if="schema.leftLabel" style="margin-top: 20px; margin-bottom: 8px; height: 24px;" class="d-flex align-center mr-2">
      <label class="v-label">{{ schema.leftLabel }} </label>
    </div>
    <v-switch :input-value="value" @change="handleInput">
      <template v-slot:label>
        {{ schema.name || label }}
        <v-btn
          v-if="!schema.required"
          icon
          @click.stop="(v) => $emit('input', undefined)"
        >
          <v-icon> mdi-close </v-icon>
        </v-btn>
      </template>
    </v-switch>
  </div>
  <file-autocomplete
    v-else-if="schema.type == 'FilePath'"
    :value="value"
    @change="handleInput"
    :recursive="!!schema.recursive"
    :path="schema.path"
    :basePath="schema.basePath"
    :clearable="!schema.required"
  />
  <color-picker
    :value="value"
    @input="handleInput"
    v-else-if="schema.type == 'LightColor'"
    :schema="schema"
    :clearable="!schema.required"
  />
  <automation-selector
    :value="value"
    @input="handleInput"
    v-else-if="schema.type == 'Automation'"
  />
</template>

<script>
import NumberInput from "./NumberInput.vue";
import ColorPicker from "./ColorPicker.vue";
import FileAutocomplete from "./FileAutocomplete.vue";
import StringDataInput from "./StringDataInput.vue";
import _cloneDeep from "lodash/cloneDeep";

export default {
  name: "data-input",
  components: {
    ObjectEditor: () => import("./ObjectEditor.vue"),
    NumberInput,
    FileAutocomplete,
    StringDataInput,
    ColorPicker,
    AutomationSelector: () => import("../automations/AutomationSelector.vue"),
    //FreeObjectEditor: () => import("./FreeObjectEditor.vue"),
  },
  props: {
    schema: {},
    value: {},
    label: {},
    context: {},
    secret: { type: Boolean, default: () => false },
  },
  methods: {
    handleInput(v) {
      if (v === null) {
        return this.$emit("input", undefined); //Need this to handle clearable returning null instead of undefined.
      }
      this.$emit("input", v);
    },
  },
};
</script>

<style>
.input-row {
  display: flex;
  flex-direction: row;
}
</style>