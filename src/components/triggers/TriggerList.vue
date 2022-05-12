<template>
  <v-card>
    <v-card-title>
      <v-text-field
        v-model="search"
        append-icon="mdi-magnify"
        label="Filter"
        single-line
        hide-details
      />
    </v-card-title>
    <v-card-text v-if="triggerPlugins">
      <v-simple-table style="white-space: nowrap; width: 100%">
        <tbody>
          <template v-for="pluginKey in triggerPlugins">
            <tr
              :key="pluginKey"
              :style="{ backgroundColor: plugins[pluginKey].color }"
            >
              <td colspan="4" class="text-h4">
                <v-icon v-text="plugins[pluginKey].icon" x-large />
                {{ plugins[pluginKey].uiName }} Triggers
              </td>
            </tr>
            <template
              v-for="triggerKey in Object.keys(visibleTriggers[pluginKey])"
            >
              <tr
                :style="{ backgroundColor: plugins[pluginKey].color }"
                :key="`${pluginKey}_${triggerKey}`"
                class="divider-row"
              >
                <td colspan="4" class="text-center">
                  {{ plugins[pluginKey].triggers[triggerKey].name }}
                </td>
              </tr>
              <trigger-list-row
                :pluginKey="pluginKey"
                :triggerKey="triggerKey"
                v-for="(mapping, i) in visibleTriggers[pluginKey][triggerKey]"
                :mapping="mapping"
                :key="mapping.id"
                @mapping="
                  (tt, mapping) =>
                    updateMapping(tt, mapping, pluginKey, triggerKey, i)
                "
                @delete="deleteMapping(pluginKey, triggerKey, i)"
              />
            </template>
          </template>
        </tbody>
      </v-simple-table>
    </v-card-text>
    <v-card-actions>
      <v-btn @click="$refs.addModal.open()"> Add Trigger </v-btn>
    </v-card-actions>
    <trigger-edit-modal
      header="Add Trigger"
      ref="addModal"
      @mapping="(tt, mapping) => addMapping(tt, mapping)"
    />
  </v-card>
</template>

<script>
import { mapGetters } from "vuex";
import AutomationPreview from "../automations/AutomationPreview.vue";
import DataView from "../data/DataView.vue";
import _cloneDeep from "lodash/cloneDeep";
import TriggerListRow from "./TriggerListRow.vue";
import TriggerEditModal from "./TriggerEditModal.vue";
export default {
  components: { DataView, AutomationPreview, TriggerListRow, TriggerEditModal },
  props: {
    value: {},
  },
  data() {
    return {
      search: null,
    };
  },
  computed: {
    ...mapGetters("ipc", ["paths", "plugins"]),
    visibleTriggers() {
      return this.value;
    },
    triggerPlugins() {
      return Object.keys(this.visibleTriggers);
    },
  },
  methods: {
    addMappingInternal(newValue, triggerType, mapping) {
      if (!(triggerType.pluginKey in newValue)) {
        newValue[triggerType.pluginKey] = {};
      }
      if (!(triggerType.triggerKey in newValue[triggerType.pluginKey])) {
        newValue[triggerType.pluginKey][triggerType.triggerKey] = [];
      }

      newValue[triggerType.pluginKey][triggerType.triggerKey].push(mapping);
    },
    addMapping(triggerType, mapping) {
      const newValue = _cloneDeep(this.value);
      this.addMappingInternal(newValue, triggerType, mapping);
      this.$emit("input", newValue);
    },
    updateMapping(triggerType, mapping, pluginKey, triggerKey, index) {
      const newValue = _cloneDeep(this.value);
      if (
        triggerType.triggerKey != triggerKey ||
        triggerType.pluginKey != pluginKey
      ) {
        //Relocate this trigger.
        // Remove the old.
        this.deleteMappingInternal(newValue, pluginKey, triggerKey, index);
        // Place the new.
        this.addMappingInternal(newValue, triggerType, mapping);
      } else {
        //Simple update
        newValue[pluginKey][triggerKey][index] = mapping;
      }
      this.$emit("input", newValue);
    },
    deleteMappingInternal(newValue, pluginKey, triggerKey, index) {
      newValue[pluginKey][triggerKey].splice(index, 1);

      if (newValue[pluginKey][triggerKey].length == 0)
      {
        delete newValue[pluginKey][triggerKey];
        if (Object.keys(newValue[pluginKey]).length == 0)
        {
          delete newValue[pluginKey]
        }
      }
    },
    deleteMapping(pluginKey, triggerKey, index) {
      const newValue = _cloneDeep(this.value);
      this.deleteMappingInternal(newValue, pluginKey, triggerKey, index); 
      this.$emit("input", newValue);
    },
  },
};
</script>

<style scoped>
.trigger-category {
  border-bottom: 1px solid #ccc !important;
}
.trigger-mapping {
  border-bottom: 1px solid #666 !important;
  background-color: #424242;
}
.no-hover:hover {
  background-color: unset !important;
}
.divider-row td {
  height: 20px !important;
}
</style>