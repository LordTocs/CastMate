<template>
  <v-container fluid>
    <v-row v-for="variableName in Object.keys(variables)" :key="variableName">
      <v-col>
        <variable-spec-editor
          :value="variables[variableName]"
          :variableName="variableName"
          @name="
            (v) => changeVariableName({ oldName: variableName, newName: v })
          "
          @input="(v) => updateVariable({ variableName, variableSpec: v })"
          @delete="() => removeVariable({ variableName })"
        />
      </v-col>
    </v-row>
    <v-fab-transition>
      <v-btn color="primary" fixed fab large right bottom @click="addVariable">
        <v-icon> mdi-plus </v-icon>
      </v-btn>
    </v-fab-transition>
  </v-container>
</template>

<script>
import VariableSpecEditor from "../components/variables/VariableSpecEditor.vue";
import { mapActions, mapGetters } from "vuex";

//import { mapIpcs } from "../utils/ipcMap";

export default {
  components: { VariableSpecEditor },
  computed: {
    ...mapGetters("variables", ["variables"]),
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
          type: "number",
          default: 0,
        },
      });
    },
  },
};
</script>

<style>
</style>