<template>
  <v-expansion-panels>
    <v-expansion-panel>
      <v-expansion-panel-header>
        <span class="text-h6">
          <v-icon v-if="plugin.icon"> {{ plugin.icon }} </v-icon>
          {{ plugin.uiName }} Triggers</span
        >
      </v-expansion-panel-header>
      <v-expansion-panel-content>
        <v-row v-for="triggerKey in triggerKeys" :key="triggerKey">
          <v-col>
            <trigger-editor
              :triggerKey="triggerKey"
              :trigger="plugin.triggers[triggerKey]"
              :value="value[triggerKey]"
              @input="(v) => setTrigger(triggerKey, v)"
            />
          </v-col>
        </v-row>
      </v-expansion-panel-content>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script>
import TriggerEditor from "../triggers/TriggerEditor.vue";

export default {
  components: { TriggerEditor },
  props: {
    plugin: {},
    value: {},
  },
  computed: {
    triggerKeys() {
      return Object.keys(this.plugin.triggers || {});
    },
  },
  methods: {
    setTrigger(triggerKey, newValue) {
      const result = { ...this.value };
      result[triggerKey] = newValue;

      this.$emit("input", result);
    },
  },
};
</script>

<style>
</style>