<template>
  <el-card class="box-card trigger-editor">
    <p>{{ triggerName }}</p>
    <el-row>
      <el-button> Add Command </el-button>
      <el-button> Import Triggers </el-button>
    </el-row>
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
        <el-button> Delete </el-button>
      </div>
      <command-editor
        :value="value[commandKey]"
        @input="(newData) => updateCommand(commandKey, newData)"
      />
    </el-card>
  </el-card>
</template>

<script>
import CommandEditor from "./CommandEditor.vue";
export default {
  components: { CommandEditor },
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