<template>
  <v-sheet class="mini-icon" :color="actionColor">
    <v-icon small> {{ actionDefinition.icon }} </v-icon>
  </v-sheet>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  props: {
    action: {},
  },
  computed: {
    ...mapGetters("ipc", ["plugins"]),
    actionDefinition() {
      if (!this.action) return null;
      const plugin = this.plugins[this.action.plugin];
      if (!plugin) return null;
      return plugin.actions[this.action.action];
    },
    actionColor() {
      if (!this.actionDefinition) return null;
      return this.actionDefinition?.color || "grey darken-2";
    },
  },
};
</script>

<style scoped>
.mini-icon {
    width: 30px;
    height: 30px;
    border-radius: 5px;
    text-align: center;
    line-height: 30px;
    display: inline-block;
}
</style>