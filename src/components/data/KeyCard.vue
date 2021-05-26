<template>
  <v-card :color="color">
    <v-card-title @click="expanded = !expanded">
      <key-input
        :value="keyValue"
        :label="label"
        @input="(v) => $emit('key-change', v)"
        v-if="expanded"
      />
      <h1 class="title" v-else>
        {{ keyValue }}
      </h1>
    </v-card-title>
    <v-expand-transition>
      <v-card-text v-if="expanded">
        <slot />
      </v-card-text>
    </v-expand-transition>
  </v-card>
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
  data() {
    return {
      expanded: false,
    };
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