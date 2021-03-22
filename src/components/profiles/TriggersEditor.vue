<template>
  <div>
    <trigger-editor
      v-for="triggerKey in Object.keys(value)"
      :key="triggerKey"
      v-model="value[triggerKey]"
      :trigger-name="
        triggers[triggerKey] ? triggers[triggerKey].name : triggerKey
      "
    />
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import TriggerEditor from "./TriggerEditor.vue";

export default {
  props: {
    value: {},
  },
  components: {
    TriggerEditor,
  },
  computed: {
    ...mapGetters("ipc", ["triggers"]),
  },
};
</script>

<style>
</style>