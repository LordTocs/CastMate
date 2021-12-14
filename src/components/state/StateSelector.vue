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
        :color="getPlugin(item.plugin).color"
        outlined
        small
      >
        {{ getPlugin(item.plugin).uiName }}
      </v-chip>
      <span v-if="item">
        {{ item.key }}
      </span>
      <span v-if="item && stateLookup[item.plugin][item.key]" class="text--secondary ml-2">
        ({{ stateLookup[item.plugin][item.key] }})
      </span>
    </template>
    <template v-slot:selection="{ item }">
      <v-chip
        class="mr-2"
        v-if="item"
        :color="getPlugin(item.plugin).color"
        outlined
        small
      >
        {{ getPlugin(item.plugin).uiName }}
      </v-chip>
      <span v-if="item">
        {{ item.key }}
      </span>
      <span v-if="item && stateLookup[item.plugin][item.key]" class="text--secondary ml-2">
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
    ...mapGetters("ipc", ["stateLookup", "plugins"]),
    stateList() {
      const stateList = [];
      for (let pluginName of Object.keys(this.stateLookup)) {
        for (let stateKey of Object.keys(this.stateLookup[pluginName])) {
          stateList.push({ plugin: pluginName, key: stateKey });
        }
      }
      return stateList;
    },
  },
  methods: {
    getPlugin(pluginName) {
      return this.plugins.find((p) => p.name == pluginName);
    },
  },
};
</script>

<style>
</style>