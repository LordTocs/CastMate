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
    <v-data-table :headers="headers" :items="value" :search="search">
      <template v-slot:item.config="props">
        <v-edit-dialog
          @open="openReconfig(props.item.id)"
          @close="doReconfig(props.item.id)"
        >
          <data-view :schema="trigger.config" :value="props.item.config" />
          <template v-slot:input>
            <data-input :schema="trigger.config" v-model="reconfig" />
          </template>
        </v-edit-dialog>
      </template>

      <template v-slot:item.automation="props">
        <automation-input
          :value="props.item.automation"
          @input="(v) => changeAutomation(props.item.id, v)"
        />
      </template>

      <template v-slot:item.actions="{ item }">
        <v-btn fab small class="mx-1" @click="tryDelete(item.id)">
          <v-icon small> mdi-delete </v-icon>
        </v-btn>
      </template>

      <template v-slot:footer.prepend>
        <v-btn @click="$refs.addCommandModal.open()"> Add Trigger </v-btn>
      </template>
    </v-data-table>
    <trigger-command-modal
      ref="addCommandModal"
      :header="`Setup New Trigger`"
      :trigger="trigger"
      @created="createNewCommand"
    />
    <confirm-dialog ref="deleteDlg" />
  </v-card>
  
</template>

<script>
import AutomationSelector from "../automations/AutomationSelector.vue";
import ConfirmDialog from "../dialogs/ConfirmDialog.vue";
import { changeObjectKey } from "../../utils/objects";
import TriggerCommandModal from "./TriggerCommandModal.vue";
import AutomationInput from "../automations/AutomationInput.vue";
import DataView from "../data/DataView.vue";
import DataInput from "../data/DataInput.vue";
import _cloneDeep from "lodash/cloneDeep";

export default {
  components: {
    ConfirmDialog,
    AutomationSelector,
    TriggerCommandModal,
    AutomationInput,
    DataView,
    DataInput
  },
  props: {
    trigger: {},
    triggerKey: { type: String },
    value: {},
  },
  data() {
    return {
      reconfig: null,
      search: "",
    };
  },
  computed: {
    triggerName() {
      return this.trigger ? this.trigger.name : this.triggerKey;
    },
    headers() {
      return [
        { text: "Config", value: "config" },
        { text: "Automation", value: "automation" },
        { text: "Options", value: "actions", sortable: false, align: "right" },
      ];
    },
  },
  methods: {
    getMapping(id) {
      return this.value.find((m) => m.id == id);
    },
    openReconfig(id) {
      const mapping = this.getMapping(id);
      console.log(mapping);
      this.reconfig = _cloneDeep(mapping.config);
    },
    doReconfig(id) {
      console.log("Reconfig " + id + " : " + this.reconfig);
      const result = [...this.value];
      const idx = result.findIndex((m) => m.id == id);
      result[idx].config = this.reconfig;

      this.$emit("input", result);
    },
    createNewCommand(command) {
      console.log("Creating new command", command);
      const result = [...(this.value ? this.value : []), command];

      this.trackAnalytic("createCommand", { trigger: this.triggerName });

      this.$emit("input", result);
    },
    changeAutomation(id, automation) {
      const result = [...this.value];
      const idx = result.findIndex((m) => m.id == id);

      result[idx].automation = automation;

      this.$emit("input", result);
    },
    async tryDelete(id) {
      if (
        await this.$refs.deleteDlg.open(
          "Confirm",
          "Are you sure you want to delete this command?"
        )
      ) {
        //Delete the command
        const result = [...this.value];
        const idx = result.findIndex((m) => m.id == id);
        result.splice(idx, 1);

        this.trackAnalytic("deleteCommand", { trigger: this.triggerName });
        this.$emit("input", result);
      }
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