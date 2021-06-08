<template>
  <key-card
    :key-value="actionKey"
    @key-change="keyChange"
    color="grey darken-3"
    defaultLabel="New Command"
  >
    <command-editor
      :value="value"
      @input="(v) => $emit('input', v)"
      @delete="() => $emit('delete')"
    />
  </key-card>
</template>

<script>
import KeyCard from "../data/KeyCard.vue";
import CommandEditor from "./CommandEditor.vue";
export default {
  components: { KeyCard, CommandEditor },
  props: {
    value: {},
    actionKey: {},
  },
  methods: {
    keyChange(newKey) {
      this.$emit("key-change", newKey);
    },
  },
};
</script>

<style>
</style>