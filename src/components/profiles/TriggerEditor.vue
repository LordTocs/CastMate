<template>
  <el-card class="trigger-editor" v-if="trigger.type != 'SingleAction'">
    <level style="margin-bottom: 1rem">
      <div class="left">
        <h3>
          {{ triggerName }}
        </h3>
      </div>
      <div class="right">
        <el-button @click="addCommand"> Add Command </el-button>
        <el-button> Import Triggers </el-button>
      </div>
    </level>
    <el-card
      class="command-editor"
      v-for="(commandKey, i) in commands"
      :key="i"
    >
      <div
        slot="header"
        class="clearfix"
        style="display: flex; flex-direction: row"
      >
        <level>
          <div class="left" style="width: 100%;">
            <key-input
              :value="commandKey"
              @input="(newKey) => changeKey(commandKey, newKey)"
              :is-number="trigger.type == 'NumberAction'"
            />
          </div>
          <div class="right">
            <el-button @click="deleteCommand(commandKey)"> Delete </el-button>
          </div>
        </level>
      </div>
      <command-editor
        :value="value[commandKey]"
        @input="(newData) => updateCommand(commandKey, newData)"
      />
    </el-card>
  </el-card>
  <el-card class="trigger-editor" v-else>
    <level style="margin-bottom: 1rem">
      <div class="left">
        <h3>
          {{ triggerName }}
        </h3>
      </div>
      <div class="right">
        <el-button> Import Triggers </el-button>
      </div>
    </level>
    <el-card class="command-editor">
      <command-editor :value="value" @input="(v) => $emit('input', v)" />
    </el-card>
  </el-card>
</template>

<script>
import KeyInput from "../data/KeyInput.vue";
import Level from "../layout/Level";
import CommandEditor from "./CommandEditor.vue";
export default {
  components: { CommandEditor, Level, KeyInput },
  computed: {
    commands() {
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