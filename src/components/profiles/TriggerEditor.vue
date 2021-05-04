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
        <v-card-actions>
          <v-spacer />
          <v-btn @click="addCommand"> Add Command </v-btn>
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