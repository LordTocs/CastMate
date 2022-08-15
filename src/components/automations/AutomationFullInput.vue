<template>
  <div>
    <div class="d-flex flex-row" style="height: 70vh">
      <div class="flex-grow-1 d-flex flex-column">
        <v-sheet color="grey darken-4" class="d-flex flex-row px-2 py-2">
          <v-tooltip bottom>
            <template v-slot:activator="{ on, attrs }">
              <v-btn color="primary" dark fab small class="mr-4" @click="preview" v-bind="attrs" v-on="on">
                <v-icon>mdi-play</v-icon>
              </v-btn>
            </template>
            <span>Preview Automation</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template v-slot:activator="{ on, attrs }">
              <div v-bind="attrs" v-on="on" style="width: min-content">
                <v-switch :value="sync" @input="changeSync" class="my-0" label="Synchronous" />
              </div>
            </template>
            <span>This automation will queue behind other Synchronous automations
              and wait to play.</span>
          </v-tooltip>
          <v-spacer />
          <v-menu v-model="automationPopover" :close-on-content-click="false" offset-y class="mx-2"
            v-if="!value || isInline">
            <template v-slot:activator="{ on, attrs }">
              <v-btn v-bind="attrs" v-on="on">Use Existing Automation </v-btn>
            </template>

            <v-card class="px-2">
              <automation-selector :value="automationFile" @input="selectAutomationPopover" :showButtons="false" />
            </v-card>
          </v-menu>
          <automation-selector :value="automationFile" @input="selectAutomationPopover" :showButtons="false"
            class="my-0" v-else />
        </v-sheet>
        <flex-scroller class="flex-grow-1">
          <sequence-editor :value="actions" @input="updateActions" style="flex: 1" />
        </flex-scroller>
      </div>
      <flex-scroller color="grey darken-4" class="toolbox">
        <action-toolbox />
      </flex-scroller>
    </div>
  </div>
</template>

<script>
import ActionToolbox from "../actions/ActionToolbox.vue";
import FlexScroller from "../layout/FlexScroller.vue";
import SequenceEditor from "../sequences/SequenceEditor.vue";
import {
  generateEmptyAutomation,
  loadAutomation,
  saveAutomation,
} from "../../utils/fileTools";
import _cloneDeep from "lodash/cloneDeep";
import AutomationSelector from "./AutomationSelector.vue";
import { mapIpcs } from "../../utils/ipcMap";
export default {
  components: {
    ActionToolbox,
    SequenceEditor,
    FlexScroller,
    AutomationSelector,
  },
  props: {
    value: {},
  },
  computed: {
    isInline() {
      return this.value instanceof Object || !this.value;
    },
    actions() {
      if (!this.value) {
        return [];
      } else if (this.isInline) {
        return this.value.actions;
      } else if (this.loadedAutomation) {
        return this.loadedAutomation.actions;
      }
      return [];
    },
    sync() {
      if (!this.value) {
        return false;
      } else if (this.isInline) {
        return this.value.sync;
      } else if (this.loadedAutomation) {
        return this.loadedAutomation.sync;
      }
      return false;
    },
    automationFile() {
      return this.isInline ? null : this.value;
    },
  },
  data() {
    return {
      loadedAutomation: null,
      dirty: false,
      automationPopover: false,
    };
  },
  methods: {
    ...mapIpcs("core", ["runActions"]),
    preview() {
      this.runActions(this.actions);
    },
    async loadAutomation() {
      if (this.isInline) return;
      this.loadedAutomation = await loadAutomation(this.value);
      this.dirty = false;
    },
    async saveAutomation() {
      if (this.isInline) return;
      await saveAutomation(this.value, this.loadedAutomation);
      this.dirty = false;
    },
    clearLoadedAutomation() {
      this.loadedAutomation = null;
      this.dirty = false;
    },
    updateActions(newActions) {
      if (!this.value) {
        //Assume inline.
        console.log("new edit");
        const newAuto = generateEmptyAutomation();
        newAuto.actions = newActions;
        this.$emit("input", newAuto);
      } else if (this.isInline) {
        console.log("inline edit");
        const newAuto = _cloneDeep(this.value);
        newAuto.actions = newActions;
        this.$emit("input", newAuto);
      } else {
        console.log("saved edit");
        this.loadedAutomation.actions = newActions;
        this.dirty = true;
      }
    },
    changeSync(newSync) {
      if (!this.value) {
        //Assume inline.
        const newAuto = generateEmptyAutomation();
        newAuto.sync = newSync;
        this.$emit("input", newAuto);
      } else if (this.isInline) {
        const newAuto = _cloneDeep(this.value);
        newAuto.sync = newSync;
        this.$emit("input", newAuto);
      } else {
        this.loadedAutomation.sync = newSync;
        this.dirty = true;
      }
    },
    selectAutomationPopover(v) {
      this.$emit("input", v);
      this.automationPopover = false;
    },
  },
  async mounted() {
    if (!this.isInline && this.value) {
      this.loadAutomation();
    }
  },
  watch: {
    value() {
      if (!this.value) {
        console.log("Clearing via watch");
        this.clearLoadedAutomation();
      } else if (!this.isInline && this.value) {
        console.log("Loading via watch");
        this.loadAutomation();
      }
    },
  },
};
</script>

<style scoped>
.toolbox {
  width: 300px;
}
</style>