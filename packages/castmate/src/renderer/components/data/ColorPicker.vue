<template>
  <v-card width="400">
    <v-toolbar flat>
      <v-tabs v-model="mode" centered>
        <v-tab value="color"> <v-icon> mdi-palette </v-icon> </v-tab>
        <v-tab value="temp"> <v-icon> mdi-brightness-5 </v-icon> </v-tab>
        <v-tab value="template"> <v-icon> mdi-code-braces </v-icon> </v-tab>
      </v-tabs>
      <v-btn icon v-if="clearable" @click="$emit('input', undefined)">
        <v-icon> mdi-close </v-icon>
      </v-btn>
    </v-toolbar>
    <v-window v-model="mode">
      <v-window-item value="color">
        <v-card flat>
          <v-card-text>
            <div style="display: flex; flex-direction: row">
              <hue-selector v-model="hsb" />
              <v-slider
                v-model="bri"
                :min="0"
                :max="100"
                vertical
                append-icon="mdi-brightness-5"
              />
            </div>
          </v-card-text>
        </v-card>
      </v-window-item>
      <v-window-item value="temp">
        <v-card flat>
          <v-card-text>
            <div style="display: flex; flex-direction: row">
              <color-temp-selector
                v-model="tb"
                :minTemp="schema.tempRange[0]"
                :maxTemp="schema.tempRange[1]"
              />
              <v-slider
                v-model="bri"
                :min="0"
                :max="100"
                vertical
                append-icon="mdi-brightness-5"
              />
            </div>
          </v-card-text>
        </v-card>
      </v-window-item>
      <v-window-item value="template">
        <v-card flat>
          <v-card-text>
            <number-input
              label="Hue"
              v-model="hue"
              :allowTemplate="true"
            />
            <number-input
              label="Saturation"
              v-model="sat"
              :allowTemplate="true"
            />
            <number-input
              label="Brightness"
              v-model="bri"
              :allowTemplate="true"
            />
            <number-input
              label="Color Temperature"
              v-model="temp"
              :allowTemplate="true"
            />
          </v-card-text>
        </v-card>
      </v-window-item>
    </v-window>
  </v-card>
</template>

<script>
import ColorTempSelector from "../colors/ColorTempSelector.vue";
import HueSelector from "../colors/HueSelector.vue";
import NumberInput from "./types/NumberInput.vue";

const indexToMode = {
  0: "color",
  1: "temp",
  2: "template",
};

const modeToIndex = {
  color: 0,
  temp: 1,
  template: 2,
};

export default {
  components: { HueSelector, ColorTempSelector, NumberInput },
  props: {
    modelValue: {},
    schema: {},
    clearable: { type: Boolean, default: () => false },
  },
  emits: ["update:modelValue"],
  computed: {
    mode: {
      get() {
        return this.modelValue?.mode;
      },
      set(newMode) {
        this.$emit("update:modelValue", {
          ...this.modelValue,
          mode: newMode,
        });
      }
    },
    hsb: {
      get() {
        return { hue: this.modelValue?.hue, sat: this.modelValue?.sat, bri: this.modelValue?.bri };
      },
      set(newHSB) {
        this.$emit("update:modelValue", {
          ...this.modelValue,
          ...newHSB,
          mode: this.modelValue?.mode || "color",
        });
      }
    },
    tb: {
      get() {
        return { temp: this.modelValue?.temp, bri: this.modelValue?.bri };
      },
      set(newTB) {
        this.$emit("update:modelValue", {
          ...this.modelValue,
          ...newTB,
          mode: this.modelValue?.mode || "temp",
        });
      }
    },
    hue: {
      get() {
        return this.modelValue?.hue;
      },
      set(newHue) {
        this.$emit("update:modelValue", {
          ...this.modelValue,
          hue: newHue,
          mode: this.modelValue?.mode || "color",
        });
      }
    },
    sat: {
      get() {
        return this.modelValue?.sat;
      },
      set(newSat) {
        this.$emit("update:modelValue", {
          ...this.modelValue,
          sat: newSat,
          mode: this.modelValue?.mode || "color",
        });
      }
    },
    bri: {
      get() {
        return this.modelValue?.bri;
      },
      set(newBri) {
        this.$emit("update:modelValue", {
          ...this.modelValue,
          bri: newBri,
          mode: this.modelValue?.mode || "color",
        });
      }
    },
    temp: {
      get() {
        return this.modelValue?.bri;
      },
      set(newTemp) {
        this.$emit("update:modelValue", {
          ...this.modelValue,
          temp: newTemp,
          mode: this.modelValue?.mode || "temp",
        });
      }
    }
  },
};
</script>

<style>
</style>