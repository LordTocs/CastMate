<template>
  <div>
    <v-tooltip :color="actionColor" top>
      <template v-slot:activator="{ on, attrs }">
        <v-sheet
          class="mini-icon"
          :color="actionColor"
          v-bind="attrs"
          v-on="on"
        >
          <v-icon small> {{ actionDefinition.icon }} </v-icon>
        </v-sheet>
      </template>
      <p class="my-1 text-subtitle">{{ actionDefinition.name }}</p>
      <v-divider />
      <data-view :schema="actionDefinition.data" :value="this.action.data" />
    </v-tooltip>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import DataView from "../data/DataView.vue";

export default {
  components: { DataView },
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