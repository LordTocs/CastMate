<template>
  <div>
    <div class="d-flex flex-row" style="height: 70vh">
      <div class="flex-grow-1 d-flex flex-column">
        <v-sheet class="d-flex flex-row px-2 py-2">
          <v-tooltip bottom>
            <template #activator="{ props }">
              <v-btn color="primary" dark fab small class="mr-4" @click="preview" v-bind="props">
                <v-icon>mdi-play</v-icon>
              </v-btn>
            </template>
            <span>Preview Automation</span>
          </v-tooltip>
          <!--v-tooltip bottom>
            <template #activator="{ props }">
              <div v-bind="props" style="width: min-content">
                <v-switch v-model="sync" class="my-0" label="Synchronous" />
              </div>
            </template>
            <span>This automation will queue behind other Synchronous automations
              and wait to play.</span>
          </v-tooltip-->
          <v-spacer />
          <v-menu v-model="automationPopover" :close-on-content-click="false" offset-y class="mx-2"
            v-if="!modelValue || isInline">
            <template #activator="{ props }">
              <v-btn v-bind="props">Use Existing Automation </v-btn>
            </template>

            <v-card class="px-2">
              <automation-selector v-model="automationFile" :showButtons="false" />
            </v-card>
          </v-menu>
          <automation-selector v-model="automationFile" :showButtons="false"
            class="my-0" v-else />
        </v-sheet>
        <flex-scroller class="flex-grow-1">
          <sequence-editor v-model="actions" style="flex: 1" />
        </flex-scroller>
      </div>
      <flex-scroller class="toolbox">
        <action-toolbox />
      </flex-scroller>
    </div>
  </div>
</template>

<script>
import ActionToolbox from "../actions/ActionToolbox.vue";
import FlexScroller from "../layout/FlexScroller.vue";
import SequenceEditor from "../sequences/SequenceEditor.vue";
import {  generateEmptyAutomation } from "../../utils/fileTools";
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
    modelValue: {},
  },
  emits: ['update:modelValue'],
  computed: {
    isInline() {
      return this.modelValue instanceof Object || !this.modelValue;
    },
    actions: {
      get() {
        if (!this.modelValue) {
          return [];
        } else if (this.isInline) {
          return this.modelValue.actions;
        } else if (this.loadedAutomation) {
          return this.loadedAutomation.actions;
        }
        return [];
      },
      set(newActions) {
        if (!this.modelValue) {
          //Assume inline.
          console.log("new edit");
          const newAuto = generateEmptyAutomation();
          newAuto.actions = newActions;
          this.$emit("update:modelValue", newAuto);
        } else if (this.isInline) {
          console.log("inline edit");
          const newAuto = _cloneDeep(this.modelValue);
          newAuto.actions = newActions;
          this.$emit("update:modelValue", newAuto);
        } else {
          console.log("saved edit");
          this.loadedAutomation.actions = newActions;
          this.dirty = true;
        }
      }
    },
    sync: {
      get() {
        if (!this.modelValue) {
          return false;
        }
        else if (this.isInline) {
          return this.modelValue.sync;
        } else if (this.loadedAutomation) {
          return this.loadedAutomation.sync;
        }
        return false;
      },
      set(newValue) {
        if (!this.modelValue) {
          //Assume inline.
          const newAuto = generateEmptyAutomation();
          newAuto.sync = newValue;
          this.$emit("update:modelValue", newAuto);
        } else if (this.isInline) {
          const newAuto = _cloneDeep(this.modelValue);
          newAuto.sync = newValue;
          this.$emit("update:modelValue", newAuto);
        } else {
          this.loadedAutomation.sync = newValue;
          this.dirty = true;
        }
      }
    },
    automationFile: {
      get() {
        return this.isInline ? null : this.modelValue;
      },
      set(newFile) {
        this.$emit("update:modelValue", newFile);
        this.automationPopover = false;
      }
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
    ...mapIpcs("io", ["getAutomation", "saveAutomation"]),
    preview() {
      this.runActions(this.actions);
    },
    async loadAutomation() {
      if (this.isInline) return;
      this.loadedAutomation = await this.getAutomation(this.modelValue);
      this.dirty = false;
    },
    async saveAutomation() {
      if (this.isInline) return;
      await this.saveAutomation(this.modelValue, this.loadedAutomation);
      this.dirty = false;
    },
    clearLoadedAutomation() {
      this.loadedAutomation = null;
      this.dirty = false;
    },
    selectAutomationPopover(v) {
      this.$emit("update:modelValue", v);
      this.automationPopover = false;
    },
  },
  async mounted() {
    if (!this.isInline && this.modelValue) {
      this.loadAutomation();
    }
  },
  watch: {
    modelValue() {
      if (!this.modelValue) {
        console.log("Clearing via watch");
        this.clearLoadedAutomation();
      } else if (!this.isInline && this.modelValue) {
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