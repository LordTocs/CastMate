<template>
  <v-sheet class="d-flex my-2 rounded" color="grey darken-4">
    <div
      class="boolean-handle expression-handle rounded-l"
      :style="{ backgroundColor: handleColor }"
    >
      <v-icon> mdi-drag </v-icon>
    </div>
    <value-condition
      class="flex-grow-1"
      :value="value"
      @input="(v) => $emit('input', v)"
    />
    <v-btn @click="$emit('delete')" icon>
      <v-icon> mdi-close </v-icon>
    </v-btn>
  </v-sheet>
</template>

<script>
import { mapGetters } from "vuex";
import ValueCondition from "./ValueCondition.vue";

export default {
  components: { ValueCondition },
  props: { value: {} },
  computed: {
    ...mapGetters("ipc", ["plugins"]),
    valuePlugin() {
      if (!this.value || !this.value.state || !this.value.state.plugin)
        return null;
      return this.plugins.find((p) => p.name == this.value.state.plugin);
    },
    handleColor() {
      if (!this.valuePlugin) return "#1f1f1f";
      return this.valuePlugin.color;
    },
  },
};
</script>

<style scoped>
.expression-handle {
  display: flex;
}
</style>