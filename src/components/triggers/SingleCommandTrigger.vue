<template>
  <v-card color="#323232">
    <v-card-title>
      {{ triggerName }}
      <v-spacer />
    </v-card-title>
    <v-card-text>
      {{ trigger.description }}
    </v-card-text>
    <automation-selector :value="value ? value.automation : null" @input="(v) => $emit('input', { automation: v } )" />
  </v-card>
</template>

<script>
import AutomationSelector from "../automations/AutomationSelector.vue";
export default {
  components: { AutomationSelector },
  computed: {
    triggerName() {
      return this.trigger ? this.trigger.name : this.triggerKey;
    },
  },
  props: {
    trigger: {},
    triggerKey: { type: String },
    value: {},
  },
};
</script>

<style>
</style>