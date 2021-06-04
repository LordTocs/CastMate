<template>
  <div v-if="value">
    <v-switch v-model="value.sync" label="Synchronous" />
    <sequence-editor v-model="value.actions" />
    <v-card-actions>
      <add-action-popover @select="addAction" />
      <v-spacer />
      <v-btn color="red" @click="$emit('delete')"> Delete </v-btn>
    </v-card-actions>
  </div>
</template>

<script>
import SequenceEditor from "../sequences/SequenceEditor.vue";
import AddActionPopover from "../actions/AddActionPopover.vue";

export default {
  components: { AddActionPopover, SequenceEditor },
  props: {
    value: {},
  },
  methods: {
    addAction(v) {
      let newCommand = { ...this.value };

      newCommand.actions.push({ [v]: null });

      this.$emit("input", newCommand);
    },
  },
};
</script>

<style>
</style>