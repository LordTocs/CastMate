<template>
  <object-input
    v-if="schema.type == 'Object' && schema.properties"
    v-model="modelObj"
    :schema="schema.properties"
    :context="context"
    :secret="secret"
  />
  <array-input 
    v-if="schema.type == 'Array'"
    v-model="modelObj"
    :schema="schema"
    :context="context"
    :secret="secret"
    :label="labelString"
  />
  <number-input
    v-else-if="schema.type == 'Number' && !schema.slider"
    v-model="modelObj"
    :allowTemplate="!!schema.template"
    :label="schema.name || label"
    :clearable="!schema.required"
    :secret="secret"
    :unit="schema.unit"
  />
  <template v-else-if="schema.type == 'Number' && schema.slider">
    <div class="text-caption"> {{ labelString }}</div>
    <v-slider
      v-model="modelObj"
      :name="labelString"
      :min="schema.slider.min"
      :max="schema.slider.max"
      :step="schema.slider.step"
      color="white"
      :append-icon="!schema.required ? 'mdi-close' : undefined"
      @click:append="clear"
    />
  </template>
  <string-input
    v-else-if="schema.type == 'String'"
    v-model="modelObj"
    :label="schema.name || label"
    :schema="schema"
    :context="context"
    :secret="secret"
  />
  <boolean-input 
    v-else-if="schema.type == 'Boolean'"
    v-model="modelObj"
    :schema="schema"
    :label="labelString"
   />
  <file-autocomplete
    v-else-if="schema.type == 'FilePath'"
    v-model="modelObj"
    :recursive="!!schema.recursive"
    :path="schema.path"
    :basePath="schema.basePath"
    :clearable="!schema.required"
    :label="labelString"
  />
  <color-picker
    v-else-if="schema.type == 'LightColor'"
    v-model="modelObj"
    :schema="schema"
    :clearable="!schema.required"
  />
  <automation-selector
    v-else-if="schema.type == 'Automation'"
    v-model="modelObj"
    :label="labelString"
  />
  <reward-selector
    v-else-if="schema.type == 'ChannelPointReward'"
    v-model="modelObj"
    :label="labelString"
  />
  <spellcast-hook-selector
    v-else-if="schema.type == 'SpellcastHook'"
    v-model="modelObj"
    :label="labelString"
   />
  <time-input
    v-else-if="schema.type == 'Duration'"
    v-model="modelObj"
    :label="labelString"
  />
  <range-input
    v-else-if="schema.type == 'Range'"
    v-model="modelObj"
    :label="labelString"
  />
</template>

<script>

import ColorPicker from "./ColorPicker.vue";
import FileAutocomplete from "./FileAutocomplete.vue";
import RewardSelector from "../rewards/RewardSelector.vue";

import RangeInput from "./types/RangeInput.vue";
import TimeInput from "./types/TimeInput.vue";
import StringInput from "./types/StringInput.vue";
import NumberInput from "./types/NumberInput.vue";
import BooleanInput from "./types/BooleanInput.vue";
import SpellcastHookSelector from "../spellcast/SpellcastHookSelector.vue";

import { defineAsyncComponent } from 'vue'

export default {
  name: "data-input",
  components: {
    ObjectInput: defineAsyncComponent(() => import("./types/ObjectInput.vue")),
    ArrayInput: defineAsyncComponent(() => import("./types/ArrayInput.vue")),
    NumberInput,
    FileAutocomplete,
    StringInput,
    ColorPicker,
    AutomationSelector: defineAsyncComponent(() => import("../automations/AutomationSelector.vue")),
    RewardSelector,
    RangeInput,
    TimeInput,
    BooleanInput,
    SpellcastHookSelector
},
  props: {
    schema: {},
    modelValue: {},
    label: {},
    context: {},
    secret: { type: Boolean, default: () => false },
  },
  emits: ["update:modelValue"],
  computed: {
    labelString() {
      return this.schema?.name || this.label;
    },
    modelObj: {
      get() {
        return this.modelValue;
      },
      set(newValue) {
        if (newValue === null) {
          //Need this to handle clearable returning null instead of undefined.
          this.clear()
        }
        this.$emit("update:modelValue", newValue);
      }
    }
  },
  methods: {
    clear() {
      this.$emit("update:modelValue", undefined);
    }
  }
};
</script>

<style>
.input-row {
  display: flex;
  flex-direction: row;
}
</style>