<template>
  <v-select
    :items="stateList"
    v-model="modelObj"
    item-title="id"
    item-value="id"
    return-object
  >
    <template v-slot:item="{ item, props }">
      <div v-bind="props" class="py-1 px-1">
        <v-chip
          class="mr-2"
          v-if="item"
          :color="plugins[item.raw.plugin].color"
          outlined
          small
        >
          {{ plugins[item.raw.plugin].uiName }}
        </v-chip>
        <span v-if="item">
          {{ item.raw.key }}
        </span>
        <span
          v-if="item && stateLookup[item.raw.plugin][item.raw.key]"
          class="text--secondary ml-2"
        >
          ({{ stateLookup[item.raw.plugin][item.raw.key] }})
        </span>
      </div>
    </template>
    <template v-slot:selection="{ item }">
      <div>
        <v-chip
          class="mr-2"
          v-if="item"
          :color="plugins[item.raw.plugin].color"
          outlined
          small
        >
          {{ plugins[item.raw.plugin].uiName }}
        </v-chip>
        <span v-if="item">
          {{ item.raw.key }}
        </span>
        <span
          v-if="item && stateLookup[item.raw.plugin][item.raw.key]"
          class="text--secondary ml-2"
        >
          ({{ stateLookup[item.raw.plugin][item.raw.key] }})
        </span>
      </div>
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
    ...mapGetters("ipc", ["stateLookup", "plugins"]),
    ...mapModel(),
    stateList() {
      const stateList = [];
      for (let pluginName of Object.keys(this.stateLookup)) {
        for (let stateKey of Object.keys(this.stateLookup[pluginName])) {
          stateList.push({ plugin: pluginName, key: stateKey, id: `${pluginName}.${stateKey}` });
        }
      }
      return stateList;
    },
  },
};
</script>

<style>
</style>