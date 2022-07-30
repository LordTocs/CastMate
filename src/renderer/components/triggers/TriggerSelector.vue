<template>
  <v-select
    :items="triggerList"
    v-model="modelObj"
    :filter="customFilter"
    :label="label"
    item-title="triggerKey"
    :item-value="getTriggerID"
    :value-comparator="comparator"
    hide-details
    :return-object="true"
  >
    <template #item="{ item, props }">
      <div v-bind="props" class="px-1 py-1">
        <v-chip class="ma-2" :color="plugins[item.raw.pluginKey].color" small>
          <v-icon start :icon="plugins[item.raw.pluginKey].icon" />
          {{ plugins[item.raw.pluginKey].uiName }}
        </v-chip>
        {{ plugins[item.raw.pluginKey].triggers[item.raw.triggerKey].name }}
      </div>
    </template>
    <template #selection="{ item }">
      <div class="px-1 py-1">
        <v-chip class="ma-2" :color="plugins[item.raw.pluginKey].color" small>
          <v-icon start :icon="plugins[item.raw.pluginKey].icon" />
          {{ plugins[item.raw.pluginKey].uiName }}
        </v-chip>
        {{ plugins[item.raw.pluginKey].triggers[item.raw.triggerKey].name }}
      </div>
    </template>
  </v-select>
</template>

<script>
import { mapGetters } from "vuex";
import _flatten from "lodash/flatten";
import _isEqual from "lodash/isEqual";
import { mapModel } from "../../utils/modelValue";
export default {
  props: {
    modelValue: {},
    label: { type: String, default: () => "Trigger" },
  },
  emits: ["update:modelValue"],
  computed: {
    ...mapGetters("ipc", ["plugins"]),
    ...mapModel(),
    triggerList() {
      return _flatten(
        Object.keys(this.plugins).map((pk) =>
          Object.keys(this.plugins[pk].triggers).map((tk) => ({
            pluginKey: pk,
            triggerKey: tk,
          }))
        )
      );
    },
  },
  methods: {
    customFilter(item, queryText) {
      const triggerText =
        this.plugins[item.pluginKey].triggers[
          item.triggerKey
        ].name.toLowerCase();
      return triggerText.indexOf(queryText.toLowerCase()) > -1;
    },
    comparator(a, b) {
      return _isEqual(a,b);
    },
    getTriggerID(triggerItem) {
      return `${triggerItem.pluginKey}.${triggerItem.triggerKey}`
    }
  },
};
</script>

<style>
</style>