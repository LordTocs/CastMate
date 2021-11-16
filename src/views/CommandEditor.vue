<template>
  <v-container fluid>
    <action-toolbox />
    <v-list>
      <v-list-item>
        <v-list-item-content>
          <v-list-item-title class="text-h5">
            {{ commandKey }}
          </v-list-item-title>
          <v-list-item-subtitle>
            Trigger: {{ triggerKey }}</v-list-item-subtitle
          >
        </v-list-item-content>
      </v-list-item>
    </v-list>
    <sequence-editor :value="command.actions" @input="updateActions" />
  </v-container>
</template>

<script>
import { mapGetters, mapMutations } from "vuex";
import ActionToolbox from "../components/actions/ActionToolbox.vue";
import SequenceEditor from "../components/sequences/SequenceEditor.vue";
export default {
  components: {
    ActionToolbox,
    SequenceEditor,
  },
  computed: {
    ...mapGetters("profile", ["profile", "profileName"]),
    triggerKey() {
      return this.$route.params.trigger;
    },
    commandKey() {
      return this.$route.params.command;
    },
    command() {
      return this.profile.triggers[this.triggerKey][this.commandKey];
    },
  },
  methods: {
    ...mapMutations("profile", ["changeCommand"]),
    updateActions(newActions) {
      const newCommand = {
        ...this.command,
        actions: newActions,
      };
      this.changeCommand({
        triggerKey: this.triggerKey,
        commandKey: this.commandKey,
        command: newCommand,
      });
    },
  },
};
</script>

<style>
</style>