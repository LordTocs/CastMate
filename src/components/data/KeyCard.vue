<template>
  <v-expansion-panel>
    <v-expansion-panel-header :color="color">
      <key-input
        :value="keyValue"
        :label="label"
        @input="(v) => $emit('key-change', v)"
      />
      <div style="width: 15px" />
    </v-expansion-panel-header>
    <v-expansion-panel-content :color="color">
      <slot />
    </v-expansion-panel-content>
  </v-expansion-panel>
</template>

<script>
import KeyInput from "./KeyInput.vue";
export default {
  components: { KeyInput },
  props: {
    label: {},
    keyValue: {},
    color: {},
  },
};
</script>

<style>
.v-expansion-panel-header {
  min-height: 48px !important;
}

.v-expansion-panel--active > .v-expansion-panel-header {
  min-height: 64px !important;
}
</style>