<template>
  <div>
    <p>{{ profileName }}</p>
    <el-form :model="profile" label-width="120px">
      <el-divider />
      <triggers-editor v-model="profile.triggers" />
    </el-form>
  </div>
</template>

<script>
import TriggersEditor from "../components/profiles/TriggersEditor.vue";
import YAML from "yaml";
import fs from "fs";
import path from "path";

export default {
  components: { TriggersEditor },
  computed: {
    profileName() {
      return this.$route.params.profile;
    },
  },
  data() {
    return {
      profile: {
        triggers: {},
      },
    };
  },
  async mounted() {
    let fileData = await fs.promises.readFile(
      path.join("./user/profiles", `${this.profileName}.yaml`),
      "utf-8"
    );

    this.profile = YAML.parse(fileData);
  },
};
</script>

<style>
</style>