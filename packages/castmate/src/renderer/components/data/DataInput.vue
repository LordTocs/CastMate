<template>
  <object-input
    v-if="schema.type == 'Object' && schema.properties"
    v-model="modelObj"
    :schema="schema.properties"
    :context="context"
    :secret="secret"
    :colorRefs="colorRefs"
  />
  <array-input 
    v-if="schema.type == 'Array'"
    v-model="modelObj"
    :schema="schema"
    :context="context"
    :secret="secret"
    :label="labelString"
    :colorRefs="colorRefs"
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
  <resource-input
    v-else-if="schema.type == 'Resource'"
    v-model="modelObj"
    :label="labelString"
    :schema="schema"
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
  <overlay-font-style-input 
    v-else-if="schema.type == 'OverlayFontStyle'"
    v-model="modelObj"
    :label="labelString"
    :color-refs="colorRefs"
    :schema="schema"
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
import ObjectInput from "./types/ObjectInput.vue";
import ArrayInput from "./types/ArrayInput.vue";
import AutomationSelector from "../automations/AutomationSelector.vue";
import ResourceInput from './types/ResourceInput.vue'
import OverlayFontStyleInput from "./types/OverlayFontStyleInput.vue";

export default {
  name: "data-input",
  components: {
    ObjectInput,
    ArrayInput,
    NumberInput,
    FileAutocomplete,
    StringInput,
    ColorPicker,
    AutomationSelector,
    RewardSelector,
    RangeInput,
    TimeInput,
    BooleanInput,
    SpellcastHookSelector,
    ResourceInput,
    OverlayFontStyleInput
},
  props: {
    schema: {},
    modelValue: {},
    label: {},
    context: {},
    secret: { type: Boolean, default: () => false },
    colorRefs: {},
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