<template>
  <div>
    <v-row v-for="triggerKey in Object.keys(triggers)" :key="triggerKey">
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