<template>
  <div>
    <el-button> Add And </el-button>
    <el-button> Add Or </el-button>
    <el-button> Add Not </el-button>
    <el-button> Add Value </el-button>
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