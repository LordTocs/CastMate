<template>
  <v-expansion-panels>
    <v-expansion-panel>
      <v-expansion-panel-header :color="panelColor">
        {{ triggerName }}
      </v-expansion-panel-header>
      <v-expansion-panel-content :color="panelColor">
        <div style="padding: 0.5rem">
          <!--command-list
            :value="value"
            @input="(newData) => $emit('input', newData)"
          /-->
        </div>
        <!--v-row v-for="(commandKey, i) in commands" :key="i">
          <v-col>
            <command-card
              :value="value[commandKey]"
              :actionKey="commandKey"
              @input="(newData) => updateCommand(commandKey, newData)"
              @delete="deleteCommand(commandKey)"
              @key-change="(v) => updateCommandKey(commandKey, v)"
            />
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <trigger-imports
              :value="value ? value.imports : undefined"
              @input="changeImports"
            />
          </v-col>
        </v-row-->
        <v-card-actions>
          <v-spacer />
          <v-btn @click="addCommand"> Add Command </v-btn>
          <v-btn @click="addImport"> Import Commands File </v-btn>
        </v-card-actions>
      </v-expansion-panel-content>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script>
import TriggerImports from "./TriggerImports.vue";
import CommandCard from "../commands/CommandCard.vue";
import CommandList from "../commands/CommandList.vue";
import { changeObjectKey } from "../../utils/objects";
export default {
  components: { TriggerImports, CommandCard, CommandList },
  props: {
    value: {},
    trigger: {},
  },
  computed: {
    hasCommands() {
      if (!this.value) return false;
      return Object.keys(this.value).length > 0;
    },
    panelColor() {
      //if (this.hasCommands) return "grey darken-2";
      return "grey darken-4";
    },
    commands() {
      if (!this.value) {
        return [];
      }
      return Object.keys(this.value).filter((key) => key != "imports");
    },
    triggerName() {
      return this.trigger ? this.trigger.name : this.triggerKey;
    },
  },
  methods: {
    updateCommandKey(oldKey, newKey) {
      const result = changeObjectKey(this.value, oldKey, newKey);

      this.$emit("input", result);
    },
    updateCommand(command, data) {
      let result = { ...this.value };

      result[command] = data;

      this.$emit("input", result);
    },
    deleteCommand(command) {
      let result = { ...this.value };

      delete result[command];

      this.$emit("input", result);
    },
    addCommand() {
      let result = {
        ...this.value,
        "": { actions: [], sync: false },
      };

      this.$emit("input", result);
    },
    addImport() {
      let result = {
        ...this.value,
        imports: [...this.value.imports],
      };

      result.imports.push("");

      this.$emit("input", result);
    },
    changeImports(newImports) {
      let result = {
        ...this.value,
        imports: newImports,
      };
      this.$emit("input", result);
    },
  },
};
</script>

<style>
</style>