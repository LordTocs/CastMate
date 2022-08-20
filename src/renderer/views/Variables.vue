<template>
  <v-container fluid>
    <v-table :headers="variableHeaders" :items="variableTable">
      <thead>
        <tr>
            <th>Variable Name</th>
            <th>Type</th>
            <th>Default Value</th>
            <th>Current Value</th>
            <th>Actions</th>
        </tr>
      </thead>
      <tbody v-if="variableTable.length > 0">
        <tr v-for="variable in variableTable" :key="variable.name">
          <td> {{ variable.name }} </td>
          <td> {{ variable.type }} </td>
          <td> {{ variable.default }} </td>
          <td> <data-popover :model-value="variable.value" @update:model-value="(value) => setVariableValue(variable.name, value)" :schema="{ type: variable.type }" /></td>
          <td> 
            <v-icon
              small
              class="mr-2"
              @click.stop="
                $refs.editDlg.open(variable.name, {
                  default: variable.default,
                  type: variable.type,
                })
                "
              icon="mdi-cog"
              />
            <v-icon small @click.stop="deleteVar(variable.name)" icon="mdi-delete"/>
          </td>
        </tr>
      </tbody>
      <tbody v-else>
        <tr>
          <td colspan="5" class="px-4 py-8 text-center">
          <span>
            Create some variables to store intermediate values in.
          </span>
          </td>
        </tr>
      </tbody>
    </v-table>
    <v-btn @click="$refs.createDlg.open('', { type: 'Number', default: 0 })" color="primary" size="large" class="my-2"> Create Variable </v-btn>
    <confirm-dialog ref="deleteDlg" />
    <variable-spec-modal ref="editDlg" />
    <variable-spec-modal
      ref="createDlg"
      title="Create New Variable"
      :showCreate="true"
      :showSave="false"
    />
    <div style="height: 5rem" />
  </v-container>
</template>

<script>
import VariableSpecModal from "../components/variables/VariableSpecModal.vue";
import ConfirmDialog from "../components/dialogs/ConfirmDialog.vue";
import { mapActions, mapGetters } from "vuex";
import { mapIpcs } from "../utils/ipcMap";
import _cloneDeep from "lodash/cloneDeep";
import NumberInput from '../components/data/types/NumberInput.vue';
import DataPopover from "../components/data/DataPopover.vue";
//import { mapIpcs } from "../utils/ipcMap";

export default {
  components: { ConfirmDialog, VariableSpecModal, NumberInput, DataPopover },
  computed: {
    ...mapGetters("variables", ["variables"]),
    ...mapGetters("ipc", ["stateLookup"]),
    variableHeaders() {
      return [
        { text: "Variable Name", value: "name" },
        { text: "Type", value: "type", sortable: false },
        { text: "Default Value", value: "default", sortable: false },
        { text: "Current Value", value: "value", sortable: false },
        { text: "Actions", value: "actions", sortable: false },
      ];
    },
    variableTable() {
      return Object.keys(this.variables).map((varName) => ({
        name: varName,
        value: this.stateLookup.variables[varName],
        default: this.variables[varName].default,
        type: this.variables[varName].type,
      }));
    },
  },
  data() {
    return {
      valueEdit: null,
    };
  },
  methods: {
    ...mapActions("variables", [
      "updateVariable",
      "changeVariableName",
      "removeVariable",
    ]),
    ...mapIpcs("variables", ["setVariableValue"]),
    addVariable() {
      this.updateVariable({
        variableName: "",
        variableSpec: {
          type: "Number",
          default: 0,
        },
      });
    },
    startEditValue(variableName) {
      this.valueEdit = _cloneDeep(this.stateLookup.variables[variableName]);
    },
    async editValue(variableName) {
      await this.setVariableValue(variableName, this.valueEdit);
      this.valueEdit = null;
    },
    async deleteVar(variableName) {
      if (
        await this.$refs.deleteDlg.open(
          "Confirm",
          "Are you sure you want to delete this variable?"
        )
      ) {
        await this.removeVariable({ variableName });
      }
    },
  },
};
</script>

<style>
</style>