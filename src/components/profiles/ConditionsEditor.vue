<template>
  <el-card class="conditions-editor">
    <h3>Conditions</h3>
    <conditional-editor :value="value" @input="(v) => $emit('input', v)" />
  </el-card>
</template>

<script>
import ConditionalEditor from "../conditionals/ConditionalEditor.vue";
export default {
  components: { ConditionalEditor },
  props: {
    value: {},
  },
  computed: {
    valueSafe() {
      if (!this.value) return {};
      return this.value;
    },
  },
};
</script>

<style scoped>
.conditions-editor {
  text-align: left;
}
</style>