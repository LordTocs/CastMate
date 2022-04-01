<template>
  <v-combobox
    :items="stateList"
    :value="value"
    item-text="key"
    @change="(v) => $emit('input', v)"
  >
    <template v-slot:item="{ item }">
      <v-chip
        class="mr-2"
        v-if="item"
        :color="plugins[item.plugin].color"
        outlined
        small
      >
        {{ plugins[item.plugin].uiName }}
      </v-chip>
      <span v-if="item">
        {{ item.key }}
      </span>
      <span
        v-if="item && stateLookup[item.plugin][item.key]"
        class="text--secondary ml-2"
      >
        ({{ stateLookup[item.plugin][item.key] }})
      </span>
    </template>
    <template v-slot:selection="{ item }">
      <v-chip
        class="mr-2"
        v-if="item"
        :color="plugins[item.plugin].color"
        outlined
        small
      >
        {{ plugins[item.plugin].uiName }}
      </v-chip>
      <span v-if="item">
        {{ item.key }}
      </span>
      <span
        v-if="item && stateLookup[item.plugin][item.key]"
        class="text--secondary ml-2"
      >
        ({{ stateLookup[item.plugin][item.key] }})
      </span>
    </template>
  </v-combobox>
</template>

<script>
import { mapGetters } from "vuex";
export default {
  props: {
    value: {},
    label: {},
  },
  computed: {
    ...mapGetters("ipc", ["stateLookup", "plugins", "stateSchemas"]),
    stateList() {
      const stateList = [];
      for (let pluginName of Object.keys(this.stateLookup)) {
        for (let stateKey of Object.keys(this.stateLookup[pluginName])) {
          //If it's not in the stateSchemas it's a variable, so we always include it.
          if (!this.stateSchemas[pluginName][stateKey] || !this.stateSchemas[pluginName][stateKey].hidden) {
            stateList.push({ plugin: pluginName, key: stateKey });
          }
        }
      }
      return stateList;
    },
  },
};
</script>

<style>
</style>