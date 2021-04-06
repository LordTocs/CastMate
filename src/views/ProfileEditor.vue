<template>
  <v-container fluid>
    <v-row>
      <v-col>
        <conditions-editor v-model="profile.conditions" />
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <variables-editor v-model="profile.variables" />
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <rewards-editor v-model="profile.rewards" />
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <triggers-editor v-model="profile.triggers" />
      </v-col>
    </v-row>
    <v-fab-transition>
      <v-btn color="primary" fab large fixed bottom right @click="save">
        <v-icon> mdi-content-save </v-icon>
      </v-btn>
    </v-fab-transition>
    <v-snackbar v-model="saveSnack" :timeout="1000" color="green">
      Saved
    </v-snackbar>
  </v-container>
</template>

<script>
import TriggersEditor from "../components/profiles/TriggersEditor.vue";
import VariablesEditor from "../components/profiles/VariablesEditor.vue";
import ConditionsEditor from "../components/profiles/ConditionsEditor.vue";
import RewardsEditor from "../components/profiles/RewardsEditor.vue";
import YAML from "yaml";
import fs from "fs";
import path from "path";

export default {
  components: {
    TriggersEditor,
    VariablesEditor,
    ConditionsEditor,
    RewardsEditor,
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
      saveSnack: false,
    };
  },
  methods: {
    async save() {
      let newYaml = YAML.stringify(this.profile);

      await fs.promises.writeFile(
        path.join("./user/profiles", `${this.profileName}.yaml`),
        newYaml
      );

      this.saveSnack = true;
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