<template>
  <v-dialog v-model="dialog" width="85%" persistent>
    <v-card>
      <v-toolbar dense flat>
        <v-toolbar-title class="font-weight-bold grey--text">
          {{ header }}
        </v-toolbar-title>
        <trigger-selector
          :value="localTriggerType"
          @input="changeTriggerType"
          label=""
          class="mx-4"
          style="width: 150px !important"
        />
      </v-toolbar>
      <div class="d-flex flex-row">
        <flex-scroller
          style="width: 300px"
          color="grey darken-4"
          innerClass="px-2"
        >
          <v-sheet outlined rounded class="px-2 py-2 my-2">
            <p class="my-2">
              {{
                plugins[localTriggerType.pluginKey].triggers[
                  localTriggerType.triggerKey
                ].name
              }}
            </p>
            <p class="text--secondary my-1">
              {{
                plugins[localTriggerType.pluginKey].triggers[
                  localTriggerType.triggerKey
                ].description
              }}
            </p>
            <v-divider />
            <data-input
              v-if="
                localTriggerType &&
                plugins[localTriggerType.pluginKey].triggers[
                  localTriggerType.triggerKey
                ].config
              "
              :schema="
                plugins[localTriggerType.pluginKey].triggers[
                  localTriggerType.triggerKey
                ].config
              "
              v-model="localMapping.config"
            />
            <p v-else class="text--centered py-4">No Configuration Needed</p>
          </v-sheet>
        </flex-scroller>
        <automation-full-input class="flex-grow-1" />
      </div>

      <v-card-actions>
        <v-spacer />
        <v-btn color="primary" @click="apply"> Apply </v-btn>
        <v-btn @click="cancel"> Cancel </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { mapGetters } from "vuex";
import DataInput from "../data/DataInput.vue";
import TriggerSelector from "./TriggerSelector.vue";
import _cloneDeep from "lodash/cloneDeep";
import AutomationInput from "../automations/AutomationInput.vue";
import AutomationFullInput from "../automations/AutomationFullInput.vue";
import FlexScroller from "../layout/FlexScroller.vue";

export default {
  components: {
    TriggerSelector,
    DataInput,
    AutomationInput,
    AutomationFullInput,
    FlexScroller,
  },
  props: {
    mapping: {},
    header: { type: String, default: () => "Add Trigger" },
    triggerType: {},
  },
  data() {
    return {
      dialog: false,
      localMapping: null,
      localTriggerType: null,
    };
  },
  computed: {
    ...mapGetters("ipc", ["plugins"]),
  },
  methods: {
    open() {
      this.localMapping = _cloneDeep(this.mapping) || {
        config: null,
        automation: null,
      };
      this.localTriggerType = _cloneDeep(this.triggerType);
      this.dialog = true;
    },
    apply() {
      this.$emit("mapping", this.localTriggerType, this.localMapping);
      this.dialog = false;
    },
    cancel() {
      this.dialog = false;
    },
    changeTriggerType(newType) {
      this.localTriggerType = newType;
      this.localMapping.config = {}; //TODO: Generate default from schema.
    },
  },
};
</script>

<style>
</style>