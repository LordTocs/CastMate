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
      <v-simple-table>
        <tbody>
          <template v-for="pluginKey in triggerPlugins">
            <!--v-sheet
          :key="pluginKey"
          :color="plugins[pluginKey].color"
          class="pl-2"
        >
          <span class="text-h4">
            <v-icon v-text="plugins[pluginKey].icon" x-large />
            {{ plugins[pluginKey].uiName }} Triggers
          </span>
        </v-sheet-->
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
                v-for="(mapping, i) in visibleTriggers[pluginKey][triggerKey]"
                :key="mapping.id"
              >
                <td :style="{ backgroundColor: plugins[pluginKey].color }">
                  {{
                    plugins[pluginKey].triggers[triggerKey].name || triggerKey
                  }}
                </td>
                <td>
                  <data-view
                    :schema="plugins[pluginKey].triggers[triggerKey].config"
                    :value="mapping.config"
                  />
                </td>
                <td>
                  <automation-input
                    :value="mapping.automation"
                    @input="
                      (v) => updateAutomation(v, pluginKey, triggerKey, i)
                    "
                  />
                </td>
                <td>
                  <v-menu bottom right>
                    <template v-slot:activator="{ on, attrs }">
                      <v-btn dark icon v-bind="attrs" v-on="on">
                        <v-icon>mdi-dots-vertical</v-icon>
                      </v-btn>
                    </template>

                    <v-list>
                      <v-list-item>
                        <v-list-item-title> Edit </v-list-item-title>
                      </v-list-item>
                      <v-list-item>
                        <v-list-item-title> Delete </v-list-item-title>
                      </v-list-item>
                      <v-list-item>
                        <v-list-item-title> Duplicate </v-list-item-title>
                      </v-list-item>
                    </v-list>
                  </v-menu>
                </td>
              </tr>
            </template>
          </template>
        </tbody>
      </v-simple-table>
    </v-card-text>
    <v-card-actions>
      <v-btn> Add Trigger </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
import { mapGetters } from "vuex";
import AutomationInput from "../automations/AutomationInput.vue";
import DataView from "../data/DataView.vue";
import _cloneDeep from "lodash/cloneDeep";
export default {
  components: { DataView, AutomationInput },
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
    updateAutomation(newAutomation, pluginKey, triggerKey, index) {
      const newValue = _cloneDeep(this.value);
      newValue[pluginKey][triggerKey][index].automation = newAutomation;
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
</style>