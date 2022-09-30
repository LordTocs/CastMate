<template>
  <v-select :items="stateList" v-model="modelObj" item-title="id" item-value="id" return-object>
    <template #item="{ item, props }">
      <v-list-item v-bind="props" title="">
        <span v-if="item" class="font-weight-black" :style="{ 'color': plugins[item.raw.plugin].color }">{{
            plugins[item.raw.plugin].uiName
        }}</span>.<span v-if="item">{{ item.raw.key }}</span>
        <span v-if="item && stateLookup[item.raw.plugin][item.raw.key]" class="text-medium-emphasis ml-2">
          ({{ stateLookup[item.raw.plugin][item.raw.key] }})
        </span>
      </v-list-item>
    </template>
    <template #selection="{ item }">
      <span v-if="item" class="font-weight-black" :style="{ 'color': plugins[item.raw.plugin].color }">{{
            plugins[item.raw.plugin].uiName
        }}</span>.<span v-if="item">{{ item.raw.key }}</span>
      <span v-if="item && stateLookup[item.raw.plugin][item.raw.key]" class="text-medium-emphasis ml-2">
        ({{ stateLookup[item.raw.plugin][item.raw.key] }})
      </span>
    </template>
  </v-select>
</template>

<script>
import { mapGetters } from "vuex";
import { mapModel } from "../../utils/modelValue";
export default {
  props: {
    modelValue: {},
    label: {},
  },
  computed: {
    ...mapGetters("ipc", ["stateLookup", "plugins", "stateSchemas"]),
    ...mapModel(),
    stateList() {
      const stateList = [];
      for (let pluginName of Object.keys(this.stateLookup)) {
        for (let stateKey of Object.keys(this.stateLookup[pluginName])) {
          //If it's not in the stateSchemas it's a variable, so we always include it.
          if (!this.stateSchemas[pluginName][stateKey] || !this.stateSchemas[pluginName][stateKey].hidden)
          {
            stateList.push({ plugin: pluginName, key: stateKey, id: `${pluginName}.${stateKey}` });
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