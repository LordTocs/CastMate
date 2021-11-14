<template>
  <v-navigation-drawer absolute permanent right class="action-list">
    <v-list dense>
      <v-list-group
        v-for="plugin in actionPlugins"
        :key="plugin.name"
        no-action
      >
        <template v-slot:activator>
          <v-list-item-content>
            <v-list-item-title v-text="plugin.uiName"></v-list-item-title>
          </v-list-item-content>
        </template>

        <v-list-item
          v-for="actionKey in Object.keys(plugin.actions)"
          :key="actionKey"
        >
          <v-list-item-avatar :color="plugin.actions[actionKey].color">
            <v-icon>mdi-file-document-outline</v-icon>
          </v-list-item-avatar>

          <v-list-item-content>
            <v-list-item-title>{{
              plugin.actions[actionKey].name
            }}</v-list-item-title>
            <v-list-item-subtitle>
              {{ plugin.actions[actionKey].description }}
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
      </v-list-group>
    </v-list>
  </v-navigation-drawer>
</template>

<script>
import { mapGetters } from "vuex";

export default {
  computed: {
    ...mapGetters("ipc", ["actions", "plugins"]),
    actionPlugins() {
      return this.plugins.filter(
        (plugin) => Object.keys(plugin.actions).length > 0
      );
    },
    actionItems() {
      return Object.keys(this.actions).map((k) => ({
        ...this.actions[k],
        key: k,
      }));
    },
  },
};
</script>

<style>
.action-list .v-list-group--no-action > .v-list-group__items > .v-list-item {
  padding-left: 16px;
}
</style>