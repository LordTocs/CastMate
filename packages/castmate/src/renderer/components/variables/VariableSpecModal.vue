<template>
  <v-dialog v-model="dialog" width="50%" @keydown.esc="cancel">
    <v-card>
      <v-toolbar dense flat>
        <v-toolbar-title class="text-body-2 font-weight-bold grey--text">
          {{ title }}
        </v-toolbar-title>
      </v-toolbar>
      <v-card-text>
        <variable-spec-editor
          v-model="variableEdit"
          v-model:name="variableEditName"
        />
      </v-card-text>
      <v-card-actions class="pt-3">
        <v-spacer></v-spacer>
        <v-btn
          color="grey"
          text
          class="body-2 font-weight-bold"
          @click.native="cancel"
        >
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          class="body-2 font-weight-bold"
          v-if="showSave"
          @click.native="save"
        >
          Save
        </v-btn>
        <v-btn
          color="primary"
          class="body-2 font-weight-bold"
          v-if="showCreate"
          @click.native="create"
        >
          Create
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import VariableSpecEditor from "./VariableSpecEditor.vue";
import _cloneDeep from "lodash/cloneDeep";
import { mapIpcs } from "../../utils/ipcMap";
export default {
  components: { VariableSpecEditor },
  props: {
    title: { type: String, default: () => "Edit Variable" },
    showSave: { type: Boolean, default: () => true },
    showCreate: { type: Boolean, default: () => false },
  },
  data() {
    return {
      dialog: false,
      variableSpec: null,
      variableName: null,
      variableEdit: null,
      variableEditName: null,
    };
  },
  methods: {
    ...mapIpcs("variables", ['updateVariableSpec', 'addVariable', "changeVariableName"]),
    open(variableName, variableSpec) {
      this.variableName = variableName;
      this.varaibleSpec = variableSpec;
      this.variableEdit = _cloneDeep(variableSpec) || {};
      this.variableEditName = String(variableName);
      this.dialog = true;
    },
    async save() {
      if (this.variableEditName != this.variableName) {
        await this.changeVariableName(this.variableName, this.variableEditName );
      }

      await this.updateVariableSpec(this.variableEditName, this.variableEdit);

      this.dialog = false;
    },
    cancel() {
      this.dialog = false;
    },
    async create() {
      await this.addVariable(this.variableEditName, this.variableEdit);
      this.dialog = false;
    },
  },
};
</script>

<style>
</style>
