<template>
  <div>
    <level style="margin-bottom: 18px">
      <div class="left">
        <h1>{{ profileName }}</h1>
      </div>
      <div class="right">
        <el-button type="success" @click="save" style="width: 120px">
          <h3>Save</h3>
        </el-button>
      </div>
    </level>
    <el-form :model="profile" label-width="120px">
      <conditions-editor v-model="profile.conditions" />
      <el-divider />
      <variables-editor v-model="profile.variables" />
      <el-divider />
      <rewards-editor v-model="profile.rewards" />
      <el-divider />
      <triggers-editor v-model="profile.triggers" />
    </el-form>
  </div>
</template>

<script>
import TriggersEditor from "../components/profiles/TriggersEditor.vue";
import VariablesEditor from "../components/profiles/VariablesEditor.vue";
import ConditionsEditor from "../components/profiles/ConditionsEditor.vue";
import RewardsEditor from "../components/profiles/RewardsEditor.vue";
import YAML from "yaml";
import fs from "fs";
import path from "path";
import Level from "@/components/layout/Level.vue";

export default {
  components: {
    TriggersEditor,
    VariablesEditor,
    ConditionsEditor,
    RewardsEditor,
    Level,
  },
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
  methods: {
    async save() {
      let newYaml = YAML.stringify(this.profile);

      await fs.promises.writeFile(
        path.join("./user/profiles", `${this.profileName}.yaml`),
        newYaml
      );

      this.$message({
        showClose: true,
        message: "Saved.",
        type: "success",
      });
    },
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