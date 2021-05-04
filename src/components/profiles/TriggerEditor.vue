<template>
  <v-expansion-panels v-if="trigger">
    <v-expansion-panel v-if="trigger.type != 'SingleAction'">
      <v-expansion-panel-header> {{ triggerName }} </v-expansion-panel-header>
      <v-expansion-panel-content>
        <v-row v-for="(commandKey, i) in commands" :key="i">
          <v-col>
            <v-expansion-panels>
              <command-editor
                :value="value[commandKey]"
                :actionKey="commandKey"
                @input="(newData) => updateCommand(commandKey, newData)"
                @delete="deleteCommand(commandKey)"
                @key-change="(v) => changeKey(commandKey, v)"
              />
            </v-expansion-panels>
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <v-card color="grey darken-3" v-if="imports">
              <v-card-title> Imports </v-card-title>
              <v-card-text>
                <v-list color="grey darken-3">
                  <v-list-item v-for="(imprt, i) in imports" :key="i">
                    <v-list-item-content>
                      <v-text-field
                        :value="imprt"
                        @change="(v) => changeImport(i, v)"
                      />
                    </v-list-item-content>
                    <v-list-item-action>
                      <v-btn color="red" @click="deleteImport(i)">
                        Delete
                      </v-btn>
                    </v-list-item-action>
                  </v-list-item>
                </v-list>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="addCommand"> Add Command </v-btn>
          <v-btn @click="addImport"> Import Triggers </v-btn>
        </v-card-actions>
      </v-expansion-panel-content>
    </v-expansion-panel>
    <v-expansion-panel v-else>
      <v-expansion-panel-header> {{ triggerName }} </v-expansion-panel-header>
      <v-expansion-panel-content>
        <v-expansion-panels>
          <command-editor :value="value" @input="(v) => $emit('input', v)" />
        </v-expansion-panels>
      </v-expansion-panel-content>
    </v-expansion-panel>
  </v-expansion-panels>
  <v-card v-else>
    <v-card-text>
      <v-row v-for="(commandKey, i) in commands" :key="i">
        <v-col>
          <v-expansion-panels>
            <command-editor
              :value="value[commandKey]"
              :actionKey="commandKey"
              @input="(newData) => updateCommand(commandKey, newData)"
              @delete="deleteCommand(commandKey)"
              @key-change="(v) => changeKey(commandKey, v)"
            />
          </v-expansion-panels>
        </v-col>
      </v-row>
    </v-card-text>
    <v-card-actions>
      <v-spacer />
      <v-btn @click="addCommand"> Add Command </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
import CommandEditor from "./CommandEditor.vue";
export default {
  components: { CommandEditor },
  computed: {
    commands() {
      if (!this.value) {
        return [];
      }
      return Object.keys(this.value).filter((key) => key != "imports");
    },
    imports() {
      if (!this.value) {
        return undefined;
      }
      return this.value.imports;
    },
    triggerName() {
      return this.trigger ? this.trigger.name : this.triggerKey;
    },
  },
  methods: {
    changeKey(oldKey, newKey) {
      const keyMap = { [oldKey]: newKey };
      const keyValues = Object.keys(this.value).map((key) => {
        const newKey = key in keyMap ? keyMap[key] : key;
        return { [newKey]: this.value[key] };
      });

      let result = Object.assign({}, ...keyValues);
      this.$emit("input", result);
    },
    addImport() {
      let result = {
        ...this.value,
      };

      if (!result.imports) result.imports = [];

      result.imports.push("");

      this.$emit("input", result);
    },
    deleteImport(index) {
      let result = {
        ...this.value,
      };

      if (!result.imports) return;

      result.imports.splice(index, 1);

      this.$emit("input", result);
    },
    changeImport(index, value) {
      let result = {
        ...this.value,
      };

      if (!result.imports) return;

      result.imports[index] = value;

      this.$emit("input", result);
    },
    updateCommand(command, data) {
      let result = {
        ...this.value,
      };

      result[command] = data;

      this.$emit("input", result);
    },
    deleteCommand(command) {
      let result = {
        ...this.value,
      };

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
  },
  props: {
    value: {},
    triggerKey: { type: String },
    trigger: {},
  },
};
</script>

<style>
.trigger-editor {
  text-align: left;
  background-color: #efefef;
}

.trigger-editor:not(:last-child) {
  margin-bottom: 1.5rem;
}

.command-editor {
  margin-bottom: 1rem;
}
</style>