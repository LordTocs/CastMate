<template>
  <div key="tempPicker" ref="picker" />
</template>

<script>
import iro from "@jaames/iro";
export default {
  props: {
    value: {},
    minTemp: {},
    maxTemp: {},
  },
  methods: {
    setupPicker() {
      this.colorPicker = new iro.ColorPicker(this.$refs.picker, {
        width: 200,
        layoutDirection: "horizontal",
        layout: [
          {
            component: iro.ui.Slider,
            options: {
              // can also be 'saturation', 'value', 'red', 'green', 'blue', 'alpha' or 'kelvin'
              sliderType: "kelvin",
              sliderShape: "circle",
              minTemperature: this.minTemp,
              maxTemperature: this.maxTemp,
            },
          },
        ],
      });

      this.colorHandler = (color) => {
        this.$emit("input", { temp: color.kelvin });
      };

      this.colorPicker.on("input:end", this.colorHandler);

      if ("temp" in this.value) {
        this.colorPicker.color.kelvin = this.value.temp;
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
    value() {
      if ("bri" in this.value && "temp" in this.value) {
        this.colorPicker.color.kelvin = this.value.temp;
      }
    },
    minTemp() {
      this.destroyPicker();
      this.setupPicker();
    },
    maxTemp() {
      this.destroyPicker();
      this.setupPicker();
    },
  },
};
</script>

<style>
</style>