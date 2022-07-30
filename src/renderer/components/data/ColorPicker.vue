<template>
  <v-card width="400">
    <v-toolbar flat>
      <v-tabs :value="santizedMode" @change="changeMode" centered>
        <v-tab :key="0"> <v-icon> mdi-palette </v-icon> </v-tab>
        <v-tab :key="1"> <v-icon> mdi-brightness-5 </v-icon> </v-tab>
        <v-tab :key="2"> <v-icon> mdi-code-braces </v-icon> </v-tab>
      </v-tabs>
      <v-btn icon v-if="clearable" @click="$emit('input', undefined)">
        <v-icon> mdi-close </v-icon>
      </v-btn>
    </v-toolbar>
    <v-tabs-items :value="santizedMode">
      <v-tab-item>
        <v-card flat>
          <v-card-text>
            <div style="display: flex; flex-direction: row">
              <hue-selector :value="value" @input="changeHue" />
              <v-slider
                :value="value ? value.bri : 100"
                :min="0"
                :max="100"
                @change="changeBri"
                vertical
                append-icon="mdi-brightness-5"
              />
            </div>
          </v-card-text>
        </v-card>
      </v-tab-item>
      <v-tab-item>
        <v-card flat>
          <v-card-text>
            <div style="display: flex; flex-direction: row">
              <color-temp-selector
                :value="value"
                @input="changeTemp"
                :minTemp="schema.tempRange[0]"
                :maxTemp="schema.tempRange[1]"
              />
              <v-slider
                :value="value ? value.bri : 100"
                :min="0"
                :max="100"
                @change="changeBri"
                vertical
                append-icon="mdi-brightness-5"
              />
            </div>
          </v-card-text>
        </v-card>
      </v-tab-item>
      <v-tab-item>
        <v-card flat>
          <v-card-text>
            <number-input
              label="Hue"
              :value="value ? value.hue : undefined"
              @input="(v) => changeHue({ hue: v })"
              :allowTemplate="true"
            />
            <number-input
              label="Saturation"
              :value="value ? value.sat : undefined"
              @input="(v) => changeHue({ sat: v })"
              :allowTemplate="true"
            />
            <number-input
              label="Brightness"
              :value="value ? value.bri : undefined"
              @input="(v) => changeHue({ bri: v })"
              :allowTemplate="true"
            />
            <number-input
              label="Color Temperature"
              :value="value ? value.temp : undefined"
              @input="(v) => changeHue({ temp: v })"
              :allowTemplate="true"
            />
          </v-card-text>
        </v-card>
      </v-tab-item>
    </v-tabs-items>
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
    value: {},
    schema: {},
    clearable: { type: Boolean, default: () => false },
  },
  computed: {
    santizedMode() {
      if (this.value && this.value.mode) {
        return modeToIndex[this.value.mode];
      }
      return 0;
    },
  },
  methods: {
    changeHue(newHue) {
      this.$emit("input", {
        ...this.value,
        ...newHue,
        mode: this.value?.mode || "color",
      });
    },
    changeTemp(newTemp) {
      this.$emit("input", {
        ...this.value,
        ...newTemp,
        mode: this.value?.mode || "temp",
      });
    },
    changeBri(newBri) {
      this.$emit("input", {
        ...this.value,
        bri: newBri,
        mode: this.value?.mode || "color",
      });
    },
    changeMode(newMode) {
      this.$emit("input", { ...this.value, mode: indexToMode[newMode] });
    },
  },
};
</script>

<style>
</style>