<template>
  <v-sheet class="d-flex my-2 rounded">
    <div
      class="boolean-handle expression-handle rounded-l"
      :style="{ backgroundColor: handleColor }"
    >
      <v-icon> mdi-drag </v-icon>
    </div>
    <value-condition
      class="flex-grow-1"
      v-model="modelObj"
    />
    <v-btn @click="$emit('delete')" icon>
      <v-icon> mdi-close </v-icon>
    </v-btn>
  </v-sheet>
</template>

<script>
import { mapGetters } from "vuex";
import { mapModel } from "../../utils/modelValue";
import ValueCondition from "./ValueCondition.vue";

export default {
  components: { ValueCondition },
  props: { modelValue: {} },
  computed: {
    ...mapGetters("ipc", ["plugins"]),
    ...mapModel(),
    valuePlugin() {
      if (!this.modelValue || !this.modelValue.state || !this.modelValue.state.plugin)
        return null;
      return this.plugins[this.modelValue.state.plugin];
    },
    handleColor() {
      if (!this.valuePlugin) return "#2f2f2f";
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