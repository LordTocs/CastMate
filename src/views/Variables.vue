<template>
  <v-container fluid>
    <v-data-table :headers="variableHeaders" :items="variableTable">
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
          mdi-pencil
        </v-icon>
        <v-icon small @click="deleteVar(item.name)"> mdi-delete </v-icon>
      </template>
      <template v-slot:footer.prepend>
        <v-btn @click="$refs.createDlg.open('', { type: 'Number', default: 0 })"> New Variable </v-btn>
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

//import { mapIpcs } from "../utils/ipcMap";

export default {
  components: { ConfirmDialog, VariableSpecModal },
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
  methods: {
    ...mapActions("variables", [
      "updateVariable",
      "changeVariableName",
      "removeVariable",
    ]),
    addVariable() {
      this.updateVariable({
        variableName: "",
        variableSpec: {
          type: "Number",
          default: 0,
        },
      });
    },
    async deleteVar(variableName) {
      if (
        await this.$refs.deleteDlg.open(
          "Confirm",
          "Are you sure you want to delete this variable?"
        )
      ) {
        console.log("Confirmed!");
        await this.removeVariable({ variableName });
      }
    },
  },
};
</script>

<style>
</style>