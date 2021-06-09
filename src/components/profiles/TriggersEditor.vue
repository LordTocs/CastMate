<template>
  <div>
    <v-row v-for="triggerKey in sortedTriggers" :key="triggerKey">
      <v-col>
        <trigger-editor
          v-model="value[triggerKey]"
          :triggerKey="triggerKey"
          :trigger="triggers[triggerKey]"
        />
      </v-col>
    </v-row>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import TriggerEditor from "../triggers/TriggerEditor.vue";

export default {
  props: {
    value: {},
  },
  components: {
    TriggerEditor,
  },
  computed: {
    ...mapGetters("ipc", ["triggers"]),
    sortedTriggers() {
      return Object.keys(this.triggers).sort((a, b) => {
        const aCommands = this.hasCommands(a);
        const bCommands = this.hasCommands(b);

        if (aCommands && !bCommands) {
          return -1;
        }
        if (!aCommands && bCommands) {
          return 1;
        }
        return 0;
      });
    },
  },
  methods: {
    hasCommands(key) {
      try {
        return Object.keys(this.value[key]).length >= 1;
      } catch {
        return false;
      }
    },
  },
};
</script>

<style scoped>
.center-this {
  display: flex;
  flex-direction: row;
  justify-content: center;
}
</style>