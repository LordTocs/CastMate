<template>
  <el-table
    :data="profiles"
    @row-click="(row) => $router.push(`/profiles/${row.name}`)"
    style="width: 100%"
  >
    <el-table-column prop="name" label="Name"> </el-table-column>
  </el-table>
</template>

<script>
import fs from "fs";
import path from "path";

export default {
  data() {
    return {
      profiles: [],
    };
  },
  methods: {
    async getFiles() {
      let profiles = await fs.promises.readdir("./user/profiles");

      profiles = profiles.filter((f) => path.extname(f) == ".yaml");

      this.profiles = profiles.map((f) => ({
        name: path.basename(f, ".yaml"),
      }));
    },
  },
  async mounted() {
    await this.getFiles();
  },
};
</script>

<style>
</style>