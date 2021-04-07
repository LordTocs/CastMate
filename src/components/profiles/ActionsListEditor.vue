<template>
  <v-timeline dense align-top>
    <action-group-editor
      v-for="(action, i) in value"
      :key="i"
      :value="action"
      @input="(v) => updateAction(i, v)"
      @delete="deleteAction(i)"
      @moveUp="moveActionUp(i)"
      @moveDown="moveActionDown(i)"
    />
  </v-timeline>
</template>

<script>
import ActionGroupEditor from "./ActionGroupEditor.vue";
export default {
  components: { ActionGroupEditor },
  props: {
    value: {},
  },
  methods: {
    updateAction(index, value) {
      let newValue = [...this.value];

      newValue[index] = value;

      this.$emit("input", newValue);
    },
    deleteAction(index) {
      let newValue = [...this.value];

      newValue.splice(index, 1);

      this.$emit("input", newValue);
    },
    newActionGroup() {
      let newValue = [...this.value, {}];

      this.$emit("input", newValue);
    },
    moveActionUp(index) {
      let newValue = [...this.value];

      let newIndex = Math.max(Math.min(index - 1, newValue.length), 0);
      if (newIndex == index) {
        return;
      }

      newValue.splice(newIndex, 0, newValue.splice(index, 1)[0]);

      this.$emit("input", newValue);
    },
    moveActionDown(index) {
      let newValue = [...this.value];

      let newIndex = Math.max(Math.min(index + 1, newValue.length), 0);
      if (newIndex == index) {
        return;
      }

      newValue.splice(newIndex, 0, newValue.splice(index, 1)[0]);

      this.$emit("input", newValue);
    },
  },
};
</script>

<style>
</style>