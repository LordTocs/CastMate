<template>
  <v-container fluid>
    <v-sheet color="grey darken-4" class="py-4 px-4 d-flex">
      <div class="d-flex flex-column mx-4">
        <v-btn
          color="primary"
          fab
          dark
          class="my-1 align-self-center"
          @click="save"
          :disabled="!dirty"
        >
          <v-icon>mdi-content-save</v-icon>
        </v-btn>
      </div>

      <div class="flex-grow-1">
        <h1>{{ profileName }}</h1>
      </div>
    </v-sheet>
    <!--v-row>
      <v-col>
        <conditions-editor v-model="profile.conditions" />
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <rewards-editor v-model="profile.rewards" />
      </v-col>
    </v-row-->
    <v-row v-for="plugin in triggerPlugins" :key="plugin.name">
      <v-col>
        <profile-plugin :plugin="plugin" v-model="profile" />
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
    </v-speed-dial>
    <v-snackbar v-model="saveSnack" :timeout="1000" color="green">
      Saved
    </v-snackbar>
    <confirm-dialog ref="deleteConfirm" />
  </v-container>
</template>

<script>
import ProfilePlugin from "../components/profiles/ProfilePlugin.vue";
import ConditionsEditor from "../components/profiles/ConditionsEditor.vue";
import RewardsEditor from "../components/profiles/RewardsEditor.vue";
import YAML from "yaml";
import fs from "fs";
import path from "path";
import { mapActions, mapGetters } from "vuex";

export default {
  components: {
    ProfilePlugin,
    ConditionsEditor,
    RewardsEditor,
    ConfirmDialog: () => import("../components/dialogs/ConfirmDialog.vue"),
  },
  computed: {
    ...mapGetters("ipc", ["paths", "plugins"]),
    profileName() {
      return this.$route.params.profile;
    },
    triggerPlugins() {
      return this.plugins.filter((p) => Object.keys(p.triggers).length > 0);
    },
  },
  data() {
    return {
      profile: {},
      saveSnack: false,
      fab: false,
      dirty: false,
    };
  },
  methods: {
    ...mapActions("profile", ["loadProfile", "saveProfile"]),
    async save() {
      let newYaml = YAML.stringify(this.profile);

      await fs.promises.writeFile(
        path.join(this.paths.userFolder, `profiles/${this.profileName}.yaml`),
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
        await fs.promises.unlink(
          path.join(this.paths.userFolder, `profiles/${this.profileName}.yaml`)
        );

        this.$router.push("/");
      }
    },
  },
  async mounted() {
    let fileData = await fs.promises.readFile(
      path.join(this.paths.userFolder, `profiles/${this.profileName}.yaml`),
      "utf-8"
    );

    this.profile = YAML.parse(fileData);
  },
};
</script>

<style>
</style>