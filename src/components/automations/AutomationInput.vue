<template>
  <div>
    <div class="d-flex flex-row" v-if="isEmpty">
      <v-btn @click="editInline" class="mx-2"> Edit Actions </v-btn>
      <v-menu
        v-model="automationPopover"
        :close-on-content-click="false"
        offset-y
        class="mx-2"
      >
        <template v-slot:activator="{ on, attrs }">
          <v-btn v-bind="attrs" v-on="on"> Choose Existing Automation </v-btn>
        </template>

        <v-card>
          <automation-selector
            :value="value"
            @input="selectAutomationPopover"
          />
        </v-card>
      </v-menu>
    </div>
    <div class="d-flex flex-row" v-else-if="hasInlineActions">
      <v-btn @click="editInline">
        <v-icon> mdi-pencil </v-icon> Edit Actions
      </v-btn>
    </div>
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
  </div>
</template>

<script>
import { generateEmptyAutomation } from "../../utils/fileTools";
import AutomationSelector from "./AutomationSelector.vue";
import InlineAutomationEditDialog from "./InlineAutomationEditDialog.vue";
export default {
  components: { AutomationSelector, InlineAutomationEditDialog },
  props: {
    value: {},
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