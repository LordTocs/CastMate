<template>
  <key-card
    :key-value="actionKey"
    @key-change="keyChange"
    color="grey darken-3"
  >
    <actions-list-editor v-model="value.actions" />
    <v-card-actions>
      <add-action-popover @select="addAction" />
      <v-btn @click="addImport" style="margin-left: 8px;"> Add Import </v-btn>
      <v-spacer />
      <v-btn color="red" @click="$emit('delete')"> Delete </v-btn>
    </v-card-actions>
  </key-card>
</template>

<script>
import KeyCard from "../data/KeyCard.vue";
import ActionsListEditor from "./ActionsListEditor";
import AddActionPopover from "./AddActionPopover.vue";
export default {
  components: { KeyCard, ActionsListEditor, AddActionPopover },
  props: {
    value: {},

    actionKey: {},
  },
  methods: {
    keyChange(newKey) {
      console.log("New Key", newKey);
      this.$emit("key-change", newKey);
    },
    addAction(v) {
      let newCommand = { ...this.value };

      newCommand.actions.push({ [v]: null });

      this.$emit("input", newCommand);
    },
    addImport() {
      let newCommand = { ...this.value };

      newCommand.actions.push({ import: null });

      this.$emit("input", newCommand);
    },
  },
};
</script>

<style>
</style>