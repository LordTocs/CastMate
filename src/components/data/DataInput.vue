<template>
  <object-editor
    :schema="schema.properties"
    :value="value"
    @input="(v) => $emit('input', v)"
    v-if="schema.type == 'Object' && schema.properties"
  />
  <div class="d-flex" v-else>
    <!--div class="d-flex"-->
    <number-input
      :value="value"
      @input="(v) => $emit('input', v)"
      v-if="schema.type == 'Number' && !schema.slider"
      :allowTemplate="!!schema.template"
      :label="schema.name || label"
      class="pt-5"
    />
    <v-slider
      v-else-if="schema.type == 'Number' && schema.slider"
      :label="schema.name || label"
      :value="value"
      :min="schema.slider.min"
      :max="schema.slider.max"
      :step="schema.slider.step"
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
      :input-value="value"
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
    <color-picker
      :value="value"
      @input="(v) => $emit('input', v)"
      v-else-if="schema.type == 'LightColor'"
      :schema="schema"
    />
    <v-btn v-if="!schema.required" @click="(v) => $emit('input', undefined)">
      Reset
    </v-btn>
  </div>
</template>

<script>
import NumberInput from "./NumberInput.vue";
import ColorPicker from "./ColorPicker.vue";
import FileAutocomplete from "./FileAutocomplete.vue";
import StringDataInput from "./StringDataInput.vue";

export default {
  name: "data-input",
  components: {
    ObjectEditor: () => import("./ObjectEditor.vue"),
    NumberInput,
    FileAutocomplete,
    StringDataInput,
    ColorPicker,
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
.input-row {
  display: flex;
  flex-direction: row;
}
</style>