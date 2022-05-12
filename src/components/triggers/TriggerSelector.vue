<template>
  <v-combobox
    :items="triggerList"
    :value="value"
    :filter="customFilter"
    :label="label"
    item-text="triggerKey"
    @change="(v) => $emit('input', v)"
    :value-comparator="comparator"
  >
    <template v-slot:item="{ item }">
      <v-list-item-title v-if="item">
        <v-chip class="ma-2" :color="plugins[item.pluginKey].color" small>
          <v-icon left v-text="plugins[item.pluginKey].icon" />
          {{ plugins[item.pluginKey].uiName }}
        </v-chip>
        {{ plugins[item.pluginKey].triggers[item.triggerKey].name }}
      </v-list-item-title>
    </template>
    <template v-slot:selection="{ item }">
      <span v-if="item">
        <v-chip class="ma-2" :color="plugins[item.pluginKey].color" small>
          <v-icon left v-text="plugins[item.pluginKey].icon" />
          {{ plugins[item.pluginKey].uiName }}
        </v-chip>
        {{ plugins[item.pluginKey].triggers[item.triggerKey].name }}
      </span>
    </template>
  </v-combobox>
</template>

<script>
import { mapGetters } from "vuex";
import _flatten from "lodash/flatten";
import _isEqual from "lodash/isEqual";
export default {
  props: {
    value: {},
    label: { type: String, default: () => "Trigger" },
  },
  computed: {
    ...mapGetters("ipc", ["plugins"]),
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
  },
};
</script>

<style>
</style>