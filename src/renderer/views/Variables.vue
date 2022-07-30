<template>
  <v-container fluid>
    <v-data-table :headers="variableHeaders" :items="variableTable">
      <template v-slot:item.value="props">
        <v-edit-dialog
          @open="() => startEditValue(props.item.name)"
          @close="() => editValue(props.item.name)"
        >
          {{ props.item.value }}
          <template v-slot:input>
            <v-text-field
              v-model="valueEdit"
              label="Value"
              v-if="props.item.type == 'String'"
            />
            <number-input v-else v-model="valueEdit" label="Value" />
          </template>
        </v-edit-dialog>
      </template>
      <template v-slot:item.actions="{ item }">
        <v-icon
          small
          class="mr-2"
          @click="
            $refs.editDlg.open(item.name, {
              default: item.default,
              type: item.type,
            })
          "
        >
          mdi-cog
        </v-icon>
        <v-icon small @click="deleteVar(item.name)"> mdi-delete </v-icon>
      </template>
      <template v-slot:footer.prepend>
        <v-btn
          @click="$refs.createDlg.open('', { type: 'Number', default: 0 })"
        >
          New Variable
        </v-btn>
      </template>
    </v-data-table>
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
//import { mapIpcs } from "../utils/ipcMap";

export default {
  components: { ConfirmDialog, VariableSpecModal, NumberInput },
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