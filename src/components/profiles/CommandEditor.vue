<template>
  <div>
    <el-form-item>
      <el-checkbox v-model="value.sync"> Synchronous </el-checkbox>
    </el-form-item>
    <actions-list-editor v-model="value.actions" />
  </div>
</template>

<script>
import ActionsListEditor from "./ActionsListEditor.vue";
export default {
  components: { ActionsListEditor },
  props: {
    value: {},
  },
};
</script>

<style>

</style>