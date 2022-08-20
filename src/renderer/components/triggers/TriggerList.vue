<template>
  <v-card>
    <v-card-title>
      <v-text-field
        v-model="search"
        append-inner-icon="mdi-magnify"
        label="Filter"
        single-line
        hide-details
      />
    </v-card-title>
    <v-card-text v-if="triggerPlugins">
      <v-table
        style="white-space: nowrap; width: 100%"
        v-if="hasTriggers"
      >
        <tbody>
          <template v-for="pluginKey in triggerPlugins" :key="pluginKey">
            <tr :style="{ backgroundColor: plugins[pluginKey].color }">
              <td colspan="5" class="text-h4">
                <v-icon :icon="plugins[pluginKey].icon" x-large />
                {{ plugins[pluginKey].uiName }} Triggers
              </td>
            </tr>
            <template
              v-for="triggerKey in Object.keys(visibleTriggers[pluginKey])"
              :key="`${pluginKey}_${triggerKey}`"
            >
              <tr
                :style="{ backgroundColor: plugins[pluginKey].color }"
                class="divider-row"
              >
                <td colspan="5" class="text-center">
                  {{ plugins[pluginKey].triggers[triggerKey].name }}
                </td>
              </tr>
              <trigger-list-row
                :pluginKey="pluginKey"
                :triggerKey="triggerKey"
                v-for="mapping in visibleTriggers[pluginKey][triggerKey]"
                :mapping="mapping"
                :key="mapping.id"
                @mapping="
                  (tt, mapping) =>
                    updateMapping(
                      tt,
                      mapping,
                      pluginKey,
                      triggerKey,
                      mapping.id
                    )
                "
                @delete="deleteMapping(pluginKey, triggerKey, mapping.id)"
              />
            </template>
          </template>
        </tbody>
      </v-table>
      <v-alert dense variant="outlined" border="left" class="mx-8 my-8" v-else>
        <p class="text-center text-h5 my-4">
          This profile doesn't have any triggers.
          <v-btn variant="outlined" class="mx-3" @click="$refs.addModal.open()">
            Add Trigger
          </v-btn>
        </p>
      </v-alert>
    </v-card-text>
    <v-card-actions>
      <v-btn @click="$refs.addModal.open()" color="primary">
        Add Trigger
      </v-btn>
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
import { filterSchema } from "../../utils/objects";
export default {
  components: { DataView, AutomationPreview, TriggerListRow, TriggerEditModal },
  props: {
    modelValue: {},
  },
  emits: ['update:modelValue'],
  data() {
    return {
      search: null,
    };
  },
  computed: {
    ...mapGetters("ipc", ["paths", "plugins"]),
    visibleTriggers() {
      const result = {};

      for (let pluginKey in this.modelValue) {
        if (!this.plugins[pluginKey]) {
          console.log("UNKNOWN PLUGIN", pluginKey);
          continue;
        }
        for (let triggerKey in this.modelValue[pluginKey]) {
          for (let triggerMapping of this.modelValue[pluginKey][triggerKey]) {
            if (!this.plugins[pluginKey].triggers[triggerKey]) {
              console.log("UNKNOWN PLUGIN TRIGGER", pluginKey, triggerKey);
              continue;
            }
            if (
              filterSchema(
                triggerMapping.config,
                this.plugins[pluginKey].triggers[triggerKey].config,
                this.search,
                this.plugins[pluginKey].triggers[triggerKey].name
              )
            ) {
              if (!(pluginKey in result)) {
                result[pluginKey] = {};
              }
              if (!(triggerKey in result[pluginKey])) {
                result[pluginKey][triggerKey] = [];
              }
              result[pluginKey][triggerKey].push(triggerMapping);
            }
          }
        }
      }

      return result;
    },
    triggerPlugins() {
      return Object.keys(this.visibleTriggers);
    },
    hasTriggers() {
      return this.modelValue && Object.keys(this.modelValue).length > 0;
    },
  },
  methods: {
    getMappingIndex(pluginKey, triggerKey, id) {
      return this.modelValue[pluginKey][triggerKey].findIndex((m) => m.id == id);
    },
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
      const newValue = _cloneDeep(this.modelValue);
      this.addMappingInternal(newValue, triggerType, mapping);
      this.$emit("update:modelValue", newValue);
    },
    updateMapping(triggerType, mapping, pluginKey, triggerKey, id) {
      const newValue = _cloneDeep(this.modelValue);

      const index = this.getMappingIndex(pluginKey, triggerKey, id);

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
      this.$emit("update:modelValue", newValue);
    },
    deleteMappingInternal(newValue, pluginKey, triggerKey, index) {
      newValue[pluginKey][triggerKey].splice(index, 1);

      if (newValue[pluginKey][triggerKey].length == 0) {
        delete newValue[pluginKey][triggerKey];
        if (Object.keys(newValue[pluginKey]).length == 0) {
          delete newValue[pluginKey];
        }
      }
    },
    deleteMapping(pluginKey, triggerKey, id) {
      const index = this.getMappingIndex(pluginKey, triggerKey, id);

      const newValue = _cloneDeep(this.modelValue);
      this.deleteMappingInternal(newValue, pluginKey, triggerKey, index);
      this.$emit("update:modelValue", newValue);
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
