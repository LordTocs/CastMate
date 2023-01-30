<template>
  <v-sheet class="d-flex my-2 rounded" color="#272727">
    <div
      class="boolean-handle expression-handle rounded-s"
      :style="{ backgroundColor: handleColor }"
    >
      <v-icon> mdi-drag </v-icon>
    </div>
    <value-condition
      class="flex-grow-1 my-2"
      v-model="modelObj"
    />
    <v-btn @click="$emit('delete')" class="mx-1 my-3" icon="mdi-close" size="x-small" color="grey-darken-3" flat/>
  </v-sheet>
</template>

<script>
import { mapState } from "pinia";
import { usePluginStore } from "../../store/plugins";
import { mapModel } from "../../utils/modelValue";
import ValueCondition from "./ValueCondition.vue";

export default {
  components: { ValueCondition },
  props: { modelValue: {} },
  computed: {
    ...mapState(usePluginStore, {
      plugins: "plugins"
    }),
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
  flex-direction: column;
  justify-content: center;
  cursor: grab;
}
</style>