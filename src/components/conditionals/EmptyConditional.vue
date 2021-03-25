<template>
  <div style="margin-bottom: 18px;">
    <el-button @click="setAnd"> Add And </el-button>
    <el-button @click="setOr"> Add Or </el-button>
    <el-button @click="setNot"> Add Not </el-button>
    <el-button @click="setValue"> Add Value </el-button>
  </div>
</template>

<script>
export default {
  props: {
    value: {},
  },
  methods: {
    setAnd() {
      this.$emit("input", { and: [] });
    },
    setOr() {
      this.$emit("input", { or: [] });
    },
    setNot() {
      this.$emit("input", { not: null });
    },
    setValue() {
      this.$emit("input", {});
    },
  },
};
</script>

<style>
</style>