<template>
  <v-dialog v-model="dialog" width="85%" persistent>
    <v-card>
      <v-toolbar dense flat>
        <v-toolbar-title class="text-body-2 font-weight-bold grey--text">
          {{ header }}
        </v-toolbar-title>
        <trigger-selector
          :value="localTriggerType"
          @input="changeTriggerType"
          label=""
        />
      </v-toolbar>
      <div class="d-flex flex-row">
        <flex-scroller style="width: 300px" color="grey darken-4" innerClass="px-4">
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