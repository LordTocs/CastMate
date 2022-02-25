<template>
  <div style="d-flex flex-row">
    <time-input :value="intervalStr" label="Interval" @input="changeInterval" />
    <time-input :value="offsetStr" label="Delay" @input="changeOffset" />
  </div>
</template>

<script>
import TimeInput from "./TimeInput.vue";
export default {
  props: {
    value: {},
  },
  components: { TimeInput },
  computed: {
    interval() {
      if (!this.value) return null;

      const [interval, offset] = this.value.split("+");
      return Number(interval);
    },
    offset() {
      if (!this.value) return null;

      const [interval, offset] = this.value.split("+");
      return Number(offset);
    },
    intervalStr() {
      if (this.interval == null) return null;
      return this.formatTimeStr(this.interval);
    },
    offsetStr() {
      if (this.offset == null) return null;
      return this.formatTimeStr(this.offset);
    },
  },
  methods: {
    parseTimeStr(str) {
      let [hours, minutes, seconds] = str.split(":");
      if (seconds == undefined) {
        console.log("Shuffle parse");
        seconds = minutes;
        minutes = hours;
        hours = 0;
      }
      if (seconds == undefined) {
        seconds = minutes;
        minutes = 0;
      }
      console.log(
        "Hours",
        Number(hours),
        "Minutes",
        Number(minutes),
        "Seconds",
        Number(seconds)
      );
      return Number(hours) * 60 * 60 + Number(minutes) * 60 + Number(seconds);
    },
    formatTimeStr(time) {
      const hours = Math.floor(time / (60 * 60));
      let remaining = time - hours * 60 * 60;
      const minutes = Math.floor(remaining / 60);
      remaining = remaining - minutes * 60;
      const seconds = Math.floor(remaining);

      if (hours > 0) {
        return (
          hours +
          ":" +
          String(minutes).padStart(2, "0") +
          ":" +
          String(seconds).padStart(2, "0")
        );
      } else {
        return (
          String(minutes).padStart(2, "0") +
          ":" +
          String(seconds).padStart(2, "0")
        );
      }
    },
    changeInterval(newInterval) {
      const seconds = this.parseTimeStr(newInterval);
      this.$emit("input", seconds + "+" + (this.offset != null ? this.offset : "0"));
    },
    changeOffset(newOffset) {
      const seconds = this.parseTimeStr(newOffset);
      this.$emit("input", (this.interval != null ? this.interval : "0") + "+" + seconds);
    },
  },
  mounted() {
    console.log("Parse Test: ", this.parseTimeStr("30:00"));
  },
};
</script>

<style>
</style>