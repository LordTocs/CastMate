<template>
  <div class="trigger-editor">
    <level>
      <div class="left">
        <p>
          {{ triggerName }}
        </p>
      </div>
      <div class="right">
        <el-button> Add Command </el-button>
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
        <el-input
          :value="commandKey"
          @input="(newKey) => changeKey(commandKey, newKey)"
        />
        <el-button @click="deleteCommand(commandKey)"> Delete </el-button>
      </div>
      <command-editor
        :value="value[commandKey]"
        @input="(newData) => updateCommand(commandKey, newData)"
      />
    </el-card>
  </div>
</template>

<script>
import Level from "../layout/Level";
import CommandEditor from "./CommandEditor.vue";
export default {
  components: { CommandEditor, Level },
  computed: {
    commands() {
      return Object.keys(this.value).filter((key) => key != "imports");
    },
  },
  methods: {
    changeKey(oldKey, newKey) {
      const keyMap = { [oldKey]: newKey };
      const keyValues = Object.keys(this.value).map((key) => {
        const newKey = keyMap[key] || key;
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
  },
  props: {
    value: {},
    triggerName: { type: String },
  },
};
</script>

<style>
.trigger-editor {
  text-align: left;
}
.command-editor {
  margin-bottom: 1rem;
}
</style>