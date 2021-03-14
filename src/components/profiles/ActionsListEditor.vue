<template>
  <div>
    <div v-for="(action, i) in value" :key="i">
      <action-editor :value="action" />
      <el-divider></el-divider>
    </div>
    <el-row>
      <el-button> New Action </el-button>
      <el-button> Import Sequence </el-button>
    </el-row>
  </div>
</template>

<script>
import ActionEditor from "./ActionEditor.vue";
export default {
  components: { ActionEditor },
  props: {
    value: {},
  },
};
</script>

<style>
</style>