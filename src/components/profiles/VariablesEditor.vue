<template>
  <el-card class="variable-editor">
    <h3>Variables</h3>
    <div
      class="input-row"
      v-for="(variableName, i) in Object.keys(value)"
      :key="i"
    >
      <el-form-item label="Name">
        <key-input
          :value="variableName"
          @input="(v) => changeKey(variableName, v)"
        />
      </el-form-item>
      <el-form-item label="Default Value">
        <el-input
          :value="value[variableName].default"
          @input="(v) => changeValue(variableName, v)"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="deleteKey(variableName)"> Delete </el-button>
      </el-form-item>
    </div>
    <level>
      <div class="right">
        <el-button @click="addVariable"> New Variable </el-button>
      </div>
    </level>
  </el-card>
</template>

<script>
import KeyInput from "../data/KeyInput.vue";
import Level from "../layout/Level.vue";
export default {
  components: { KeyInput, Level },
  props: {
    value: {},
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
    changeValue(key, value) {
      let newValue = { ...this.value };

      newValue[key].default = value;

      this.$emit("input", newValue);
    },
    deleteKey(key) {
      let newValue = { ...this.value };

      delete newValue[key];

      this.$emit("input", newValue);
    },
    addVariable() {
      let newValue = { ...this.value, "": { default: null } };

      this.$emit("input", newValue);
    },
  },
};
</script>

<style scoped>
.input-row {
  display: flex;
  flex-direction: row;
}
.variable-editor {
  text-align: left;
}
</style>