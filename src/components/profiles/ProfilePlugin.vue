<template>
  <v-expansion-panels>
    <v-expansion-panel>
      <v-expansion-panel-header>
        <!--todo icon-->{{ plugin.uiName }}
      </v-expansion-panel-header>
      <v-expansion-panel-content>
        <v-row
          v-for="triggerKey in triggerKeys"
          :key="triggerKey"
        >
          <v-col>
            <trigger-editor
              :triggerKey="triggerKey"
              :trigger="triggers[triggerKey]"
              :value="(value.triggers || {})[triggerKey]"
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
import { mapGetters } from "vuex";

export default {
  components: { TriggerEditor },
  props: {
    plugin: {},
    value: {},
  },
  computed: {
    ...mapGetters("ipc", ["plugins", "triggers"]),
    triggerKeys() {
      return Object.keys(this.plugin.triggers || {});
    },
  },
  methods: {
    setTrigger(triggerKey, newValue) {
      const result = { ...this.value };
      result.triggers[triggerKey] = newValue;

      this.$emit("input", result);
    },
  },
};
</script>

<style>
</style>