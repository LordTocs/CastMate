<template>
  <div style="width: 200px" key="huePicker" ref="picker" />
</template>

<script>
import iro from "@jaames/iro";
export default {
  props: {
    value: {}, //{hue, sat, bri}
  },
  methods: {
    setupPicker() {
      console.log("Mounting Picker");
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
        this.$emit("input", result);
      };

      this.colorPicker.on("input:end", this.colorHandler);

      if (this.value && "hue" in this.value && "sat" in this.value && "bri" in this.value) {
        this.colorPicker.color.hsv = {
          h: this.value.hue,
          s: this.value.sat,
          v: this.value.bri,
        };
      }
    },
    destroyPicker() {
      console.log("Unmounting Picker");
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
    value() {
      if (this.value && "hue" in this.value && "sat" in this.value && "bri" in this.value) {
        this.colorPicker.color.hsv = {
          h: this.value.hue,
          s: this.value.sat,
          v: this.value.bri,
        };
      }
    },
  },
};
</script>

<style>
</style>