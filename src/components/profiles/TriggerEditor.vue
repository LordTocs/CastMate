<template>
  <div>
    <el-row>
      <p>{{ triggerName }}</p>
      <el-button> Add Command </el-button>
      <el-button> Import Triggers </el-button>
    </el-row>
    <command-editor
      v-for="commandKey in Object.keys(value)"
      :key="commandKey"
      v-model="value[commandKey]"
    />
  </div>
</template>

<script>
import CommandEditor from "./CommandEditor.vue";
export default {
  components: { CommandEditor },
  props: {
    value: {},
    triggerName: { type: String },
  },
};
</script>

<style>
</style>