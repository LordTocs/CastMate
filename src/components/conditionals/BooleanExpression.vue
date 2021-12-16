<template>
  <v-sheet class="d-flex my-2" color="grey darken-4">
    <div class="boolean-handle expression-handle">
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
import ValueCondition from "./ValueCondition.vue";

export default {
  components: { ValueCondition },
  props: { value: {} },
};
</script>

<style scoped>
.expression-handle {
  width: 20px;
  background-color: blue;
}
</style>