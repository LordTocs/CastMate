<template>
  <div>
    <action-editor v-for="(action, i) in value" :key="i" :value="action" />
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