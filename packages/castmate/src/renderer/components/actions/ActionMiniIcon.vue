<template>
  <div v-if="actionDefinition">
    <v-tooltip location="top" :content-props="contentProps">
      <template v-slot:activator="{ props }">
        <v-sheet
          :class="{'mini-icon-small': size != 'x-small', 'mini-icon-x-small': size == 'x-small'}"
          :color="actionColor"
          v-bind="props"
        >
          <v-icon :size="size" v-if="actionDefinition.icon"> {{ actionDefinition.icon }} </v-icon>
        </v-sheet>
      </template>
      <p class="my-1 text-subtitle">{{ actionDefinition.name }}</p>
      <v-divider />
      <data-view :schema="actionDefinition.data" :value="this.action.data" />
    </v-tooltip>
  </div>
</template>

<script>
import { mapState } from "pinia";
import { usePluginStore } from "../../store/plugins";
import DataView from "../data/DataView.vue";

export default {
  components: { DataView },
  props: {
    action: {},
    size: { type: String, default: 'small'}
  },
  computed: {
    ...mapState(usePluginStore, {
      plugins: "plugins"
    }),
    actionDefinition() {
      if (!this.action) return null;
      const plugin = this.plugins[this.action.plugin];
      if (!plugin) return null;
      return plugin.actions[this.action.action];
    },
    actionColor() {
      if (!this.actionDefinition) return null;
      return this.actionDefinition?.color || "#7a7a7a";
    },
    contentProps() {
      return {
        style: `background-color: ${this.actionColor}; color: white !important;`
      }
    }
  },
};
</script>

<style scoped>
.mini-icon-small {
  width: 30px;
  height: 30px;
  border-radius: 5px;
  text-align: center;
  line-height: 30px;
  display: inline-block;
}

.mini-icon-x-small {
  width: 20px;
  height: 20px;
  border-radius: 5px;
  text-align: center;
  line-height: 20px;
  display: inline-block;
}
</style>