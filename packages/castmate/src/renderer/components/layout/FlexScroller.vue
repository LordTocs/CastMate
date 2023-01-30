<template>
  <div class="scroller-outer">
    <v-sheet :color="color" :class="['scroller-inner', innerClass]">
      <slot />
    </v-sheet>
  </div>
</template>

<script>
export default {
  props: {
    color: { type: String, default: "transparent" },
    innerClass: {},
  },
};
</script>

<style scoped>
.scroller-outer {
  position: relative;
}
.scroller-inner {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: auto;
}
</style>