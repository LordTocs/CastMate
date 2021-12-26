<template>
  <v-list class="action-list" dense>
    <v-list-group v-for="plugin in actionPlugins" :key="plugin.name" no-action>
      <template v-slot:activator>
        <v-list-item-content>
          <v-list-item-title>
            <v-icon v-if="plugin.icon"> {{ plugin.icon }} </v-icon>
            {{ plugin.uiName }}
          </v-list-item-title>
        </v-list-item-content>
      </template>

      <draggable
        :list="pluginActionLists[plugin.name]"
        :group="{ name: 'actions', pull: 'clone', put: false }"
        :component-data="{ attrs: { 'no-action': true } }"
      >
        <v-list-item
          v-for="actionKey in Object.keys(plugin.actions)"
          :key="actionKey"
        >
          <v-list-item-avatar :color="plugin.actions[actionKey].color">
            <v-icon>
              {{
                plugin.actions[actionKey].icon
                  ? plugin.actions[actionKey].icon
                  : "mdi-file-document-outline"
              }}</v-icon
            >
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
      </draggable>
    </v-list-group>
  </v-list>
</template>

<script>
import { mapGetters } from "vuex";
import Draggable from "vuedraggable";
import { constructDefaultSchema } from "../../utils/objects";

export default {
  components: { Draggable },
  computed: {
    ...mapGetters("ipc", ["actions", "plugins"]),
    actionPlugins() {
      return this.plugins.filter(
        (plugin) => Object.keys(plugin.actions).length > 0
      );
    },
    pluginActionLists() {
      const pluginLists = {};

      for (let plugin of this.actionPlugins) {
        pluginLists[plugin.name] = Object.keys(plugin.actions).map(
          (actionKey) => ({
            [actionKey]: constructDefaultSchema(plugin.actions[actionKey].data),
          })
        );
      }

      return pluginLists;
    },
  },
};
</script>

<style>
.action-list .v-list-group--no-action > .v-list-group__items > .v-list-item {
  padding-left: 16px;
}
</style>