<template>
  <v-expansion-panels>
    <v-expansion-panel>
      <v-expansion-panel-header>
        <!--todo icon-->{{ plugin.uiName }} Triggers
      </v-expansion-panel-header>
      <v-expansion-panel-content>
        <v-row
          v-for="triggerKey in Object.keys(plugin.triggers)"
          :key="triggerKey"
        >
          <v-col>
            <trigger-editor
              :triggerKey="triggerKey"
              :trigger="triggers[triggerKey]"
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
  },
  computed: {
    ...mapGetters("ipc", ["plugins", "triggers"]),
  },
};
</script>

<style>
</style>