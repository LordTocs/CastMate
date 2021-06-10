<template>
  <v-expansion-panels>
    <v-expansion-panel>
      <v-expansion-panel-header :color="panelColor">
        {{ triggerName }}
      </v-expansion-panel-header>
      <v-expansion-panel-content :color="panelColor">
        <command-editor :value="value" @input="(v) => $emit('input', v)" />
      </v-expansion-panel-content>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script>
import CommandEditor from "../commands/CommandEditor.vue";
export default {
  components: { CommandEditor },
  computed: {
    hasCommands() {
      if (!this.value) return false;
      return Object.keys(this.value).length > 0;
    },
    panelColor() {
      if (this.hasCommands) return "grey darken-2";
      return "";
    },
    commands() {
      if (!this.value) {
        return [];
      }
      return Object.keys(this.value).filter((key) => key != "imports");
    },
    triggerName() {
      return this.trigger ? this.trigger.name : this.triggerKey;
    },
  },
  props: {
    value: {},
    trigger: {},
  },
};
</script>

<style>
</style>