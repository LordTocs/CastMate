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
    <v-speed-dial v-model="fab" fixed bottom right open-on-hover>
      <template v-slot:activator>
        <v-btn v-model="fab" color="primary" fab>
          <v-icon v-if="fab"> mdi-close </v-icon>
          <v-icon v-else> mdi-dots-vertical </v-icon>
        </v-btn>
      </template>
      <v-btn fab dark small color="green" @click="save">
        <v-icon>mdi-content-save</v-icon>
      </v-btn>
      <v-btn fab dark small color="red" @click="deleteMe">
        <v-icon>mdi-delete</v-icon>
      </v-btn>
    </v-speed-dial>
    <v-snackbar v-model="saveSnack" :timeout="1000" color="green">
      Saved
    </v-snackbar>
    <confirm-dialog ref="deleteConfirm" />
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
    ConfirmDialog: () => import("../components/dialogs/ConfirmDialog.vue"),
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
      fab: false,
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
    async deleteMe() {
      if (
        await this.$refs.deleteConfirm.open(
          "Confirm",
          "Are you sure you want to delete this profile?"
        )
      ) {
        await fs.promises.unlink(`./user/profiles/${this.profileName}.yaml`);

        this.$router.push("/");
      }
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