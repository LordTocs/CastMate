<template>
  <div style="width: 200px" key="huePicker" ref="picker" />
</template>

<script>
import iro from "@jaames/iro";
export default {
  props: {
    modelValue: {}, //{hue, sat, bri}
  },
  emits: ['update:modelValue'],
  methods: {
    setupPicker() {
      this.colorPicker = new iro.ColorPicker(this.$refs.picker, {
        width: 200,
        layoutDirection: "horizontal",
        wheelLightness: false,
        layout: [{ component: iro.ui.Wheel }],
      });

      this.colorHandler = (color) => {
        const result = {
          hue: color.hsv.h,
          sat: color.hsv.s,
          bri: color.hsv.v,
        };
        this.$emit("update:modelValue", result);
      };

      this.colorPicker.on("input:end", this.colorHandler);

      if (this.modelValue && "hue" in this.modelValue && "sat" in this.modelValue && "bri" in this.modelValue) {
        this.colorPicker.color.hsv = {
          h: this.modelValue.hue,
          s: this.modelValue.sat,
          v: this.modelValue.bri,
        };
      }
    },
    destroyPicker() {
      if (this.colorPicker) {
        this.colorPicker.off("input:end", this.colorHandler);
      }
      this.colorPicker = null;
    },
  },
  mounted() {
    this.setupPicker();
  },
  destroyed() {
    this.destroyPicker();
  },
  watch: {
    modelValue() {
      if (this.modelValue && "hue" in this.modelValue && "sat" in this.modelValue && "bri" in this.modelValue) {
        this.colorPicker.color.hsv = {
          h: this.modelValue.hue,
          s: this.modelValue.sat,
          v: this.modelValue.bri,
        };
      }
    },
  },
};
</script>

<style>
</style>