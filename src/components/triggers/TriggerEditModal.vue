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
          label="Trigger"
          class="mx-4 flex-grow-0"
          style="width: 400px"
        />
      </v-toolbar>
      <div class="d-flex flex-row">
        <flex-scroller
          style="width: 300px"
          color="grey darken-4"
          innerClass="px-2"
        >
          <v-sheet outlined rounded class="px-2 py-2 my-2">
            <template v-if="localTriggerType">
              <p class="my-2">
                {{ triggerDesc.name }}
              </p>
              <p class="text--secondary my-1">
                {{ triggerDesc.description }}
              </p>
              <v-divider />
            </template>

            <data-input
              v-if="triggerDesc && configSchema"
              :schema="configSchema"
              v-model="localMapping.config"
            />
            <p v-else-if="triggerDesc" class="text-centered my-4">
              No Configuration Needed
            </p>
            <p v-else class="text-centered my-4">Select a Trigger</p>
          </v-sheet>
        </flex-scroller>
        <automation-full-input
          class="flex-grow-1"
          v-if="localMapping"
          v-model="localMapping.automation"
        />
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
import { constructDefaultSchema } from "../../utils/objects";

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
    triggerDesc() {
      if (!this.localTriggerType) return null;
      return this.plugins[this.localTriggerType.pluginKey]?.triggers[
        this.localTriggerType.triggerKey
      ];
    },
    configSchema() {
      return this.triggerDesc?.config;
    },
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
      this.localMapping.config = constructDefaultSchema(
        this.plugins[this.localTriggerType.pluginKey].triggers[
          this.localTriggerType.triggerKey
        ].config
      );
    },
  },
};
</script>

<style>
</style>