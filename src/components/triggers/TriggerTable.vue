<template>
  <v-card class="trigger-card" color="#323232">
    <v-card-title>
      {{ triggerName }}
      <v-spacer />
      <v-text-field
        v-model="search"
        append-icon="mdi-magnify"
        label="Filter"
        single-line
        hide-details
      />
    </v-card-title>
    <v-card-text>
      {{ trigger.description }}
    </v-card-text>
    <v-data-table :headers="headers" :items="commandList" :search="search">
      <template v-slot:item.key="props">
        <v-edit-dialog
          @open="openRename(props.item.key)"
          @close="renameCommand(props.item.key, rename)"
        >
          <slot name="label" :item="props.item" :commandList="commandList">
            {{ props.item.key }}
          </slot>
          <template v-slot:input>
            <slot
              name="selector"
              :item="props.item"
              :value="rename"
              :valueInput="(newValue) => (rename = newValue)"
            />
          </template>
        </v-edit-dialog>
      </template>

      <template v-slot:item.automation="props">
        <automation-selector
          :value="props.item.automation"
          @input="(v) => changeAutomation(props.item.key, v)"
        />
      </template>

      <template v-slot:item.actions="{ item }">
        <v-btn fab small class="mx-1" @click="tryDelete(item.key)">
          <v-icon small> mdi-delete </v-icon>
        </v-btn>
      </template>

      <template v-slot:footer.prepend>
        <v-btn @click="$refs.addCommandModal.open()"> Add Command </v-btn>
      </template>
    </v-data-table>
    <trigger-command-modal
      ref="addCommandModal"
      :header="`Setup New Trigger`"
      :label="triggerUnit"
      :trigger="trigger"
      @created="createNewCommand"
    >
      <template v-slot:new-selector="selectProps">
        <slot
          name="new-selector"
          :value="selectProps.value"
          :valueInput="selectProps.valueInput"
          :label="selectProps.label"
        >
        </slot>
      </template>
    </trigger-command-modal>
    <confirm-dialog ref="deleteDlg" />
  </v-card>
</template>

<script>
import AutomationSelector from "../automations/AutomationSelector.vue";
import ConfirmDialog from "../dialogs/ConfirmDialog.vue";
import { changeObjectKey } from "../../utils/objects";
import TriggerCommandModal from "./TriggerCommandModal.vue";

export default {
  components: {
    ConfirmDialog,
    AutomationSelector,
    TriggerCommandModal,
  },
  props: {
    trigger: {},
    triggerKey: { type: String },
    value: {},
  },
  data() {
    return {
      rename: null,
      search: "",
    };
  },
  computed: {
    commandList() {
      const triggerObj = this.value;
      if (!triggerObj) return [];
      return Object.keys(triggerObj)
        .filter((key) => key != "imports")
        .map((key) => ({
          ...triggerObj[key],
          key,
        }));
    },
    triggerUnit() {
      return this.trigger ? this.trigger.triggerUnit || 'Command' : 'Command';
    },
    triggerName() {
      return this.trigger ? this.trigger.name : this.triggerKey;
    },
    headers() {
      return [
        { text: this.triggerUnit, value: "key" },
        { text: "Automation", value: "automation" },
        { text: "Actions", value: "actions", sortable: false, align: "right" },
      ];
    },
  },
  methods: {
    openRename(commandKey) {
      this.rename = commandKey;
    },
    createNewCommand({ key, automation }) {
      if (this.value && key in this.value) return;

      const result = { ...this.value };
      result[key] = { automation: automation };

      this.trackAnalytic("createCommand", { trigger: this.triggerName });

      this.$emit("input", result);
    },
    changeAutomation(commandKey, automationName) {
      const result = { ...this.value };
      result[commandKey] = { automation: automationName };
      this.$emit("input", result);
    },
    async tryDelete(commandKey) {
      if (
        await this.$refs.deleteDlg.open(
          "Confirm",
          "Are you sure you want to delete this command?"
        )
      ) {
        //Delete the command
        const result = { ...this.value };
        delete result[commandKey];
        this.trackAnalytic("deleteCommand", { trigger: this.triggerName });
        this.$emit("input", result);
      }
    },
    renameCommand(oldKey, newKey) {
      console.log("Renaming Command: ", oldKey, newKey, !newKey);

      if (!newKey) return;

      const result = changeObjectKey(this.value, oldKey, newKey);
      this.$emit("input", result);
    },
  },
};
</script>

<style>
.trigger-card tbody tr:nth-of-type(even) {
  background-color: #323232;
}

.trigger-card tbody tr:nth-of-type(odd) {
  background-color: #323232;
}

.trigger-card .v-data-table-header {
  background-color: #323232;
  color: white;
}

.trigger-card .v-data-footer {
  background-color: #323232;
}
</style>