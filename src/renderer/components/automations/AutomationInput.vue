<template>
  <v-sheet class="d-flex flex-row align-center my-3 py-2 px-2" outlined rounded>
    <p class="my-0 text-h6 mx-3" v-if="label">{{ label }}:</p>
    <template v-if="isEmpty">
      <v-btn @click="editInline" class="mx-2" color="blue darken-1">
        <v-icon> mdi-flash </v-icon> Add Actions
      </v-btn>
      <v-menu
        v-model="automationPopover"
        :close-on-content-click="false"
        offset-y
      >
        <template #activator="{ props }">
          <v-btn v-bind="props">
            Existing Automation
          </v-btn>
        </template>

        <v-card>
          <automation-selector
            :value="value"
            @input="selectAutomationPopover"
          />
        </v-card>
      </v-menu>
    </template>
    <template v-else-if="hasInlineActions">
      <v-btn @click="editInline" class="mx-2">
        <v-icon> mdi-flash </v-icon> Edit Actions
      </v-btn>
      <action-mini-preview :automation="value" />
    </template>
    <automation-selector
      v-else-if="hasAutomationReference"
      :value="value"
      @input="(v) => $emit('input', v)"
    />
    <inline-automation-edit-dialog
      :value="value"
      @input="(v) => $emit('input', v)"
      ref="editDlg"
    />
  </v-sheet>
</template>

<script>
import { generateEmptyAutomation } from "../../utils/fileTools";
import ActionMiniPreview from "../actions/ActionMiniPreview.vue";
import AutomationSelector from "./AutomationSelector.vue";
import InlineAutomationEditDialog from "./InlineAutomationEditDialog.vue";
export default {
  components: {
    AutomationSelector,
    InlineAutomationEditDialog,
    ActionMiniPreview,
  },
  props: {
    value: {},
    label: {},
  },
  data() {
    return {
      automationPopover: false,
    };
  },
  methods: {
    editInline() {
      if (!this.value) {
        this.$emit("input", generateEmptyAutomation());
      }
      this.$refs.editDlg.open();
    },
    selectAutomationPopover(v) {
      this.$emit("input", v);
      this.automationPopover = false;
    },
  },
  computed: {
    hasInlineActions() {
      return this.value instanceof Object;
    },
    hasAutomationReference() {
      return typeof this.value == "string" || this.value instanceof String;
    },
    isEmpty() {
      return !this.hasInlineActions && !this.hasAutomationReference;
    },
  },
};
</script>

<style>
</style>