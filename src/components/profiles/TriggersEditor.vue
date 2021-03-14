<template>
  <div>
    <trigger-editor
      v-for="triggerName in Object.keys(value)"
      :key="triggerName"
      v-model="value[triggerName]"
      :trigger-name="triggerName"
    />
  </div>
</template>

<script>
import TriggerEditor from "./TriggerEditor.vue";

export default {
  props: {
    value: {},
  },
  components: {
    TriggerEditor,
  },
  computed: {},
};
</script>

<style>
</style>