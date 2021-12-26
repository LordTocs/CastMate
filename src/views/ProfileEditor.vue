<template>
  <div>
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
    <v-container fluid>
      <v-row>
        <v-col>
          <v-card v-if="profile">
            <v-card-title> Profile Activation </v-card-title>
            <v-card-subtitle>
              These conditions dictate whether this profile is active.
            </v-card-subtitle>
            <v-card-text>
              <boolean-group v-model="profile.conditions" :hasHandle="false" />
            </v-card-text>
            <v-card-subtitle>
              These automations get run when a profile becomes active and
              becomes inactive.
            </v-card-subtitle>
            <v-card-text>
              <automation-selector
                v-model="profile.onActivate"
                label="Activation Automation"
              />
              <automation-selector
                v-model="profile.onDeactivate"
                label="Deactivation Automation"
              />
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
      <v-row v-if="profile">
        <v-col>
          <rewards-editor v-model="profile.rewards" />
        </v-col>
      </v-row>
      <v-row v-for="plugin in triggerPlugins" :key="plugin.name">
        <v-col>
          <profile-plugin v-if="profile" :plugin="plugin" v-model="profile" />
        </v-col>
      </v-row>
      <v-snackbar v-model="saveSnack" :timeout="1000" color="green">
        Saved
      </v-snackbar>
      <confirm-dialog ref="deleteConfirm" />
    </v-container>
    <confirm-dialog ref="saveDlg" />
  </div>
</template>

<script>
import ProfilePlugin from "../components/profiles/ProfilePlugin.vue";
import ConditionsEditor from "../components/profiles/ConditionsEditor.vue";
import RewardsEditor from "../components/profiles/RewardsEditor.vue";
import AutomationSelector from "../components/automations/AutomationSelector.vue";
import YAML from "yaml";
import fs from "fs";
import path from "path";
import { mapActions, mapGetters } from "vuex";
import BooleanExpression from "../components/conditionals/BooleanExpression.vue";
import BooleanGroup from "../components/conditionals/BooleanGroup.vue";

export default {
  components: {
    ProfilePlugin,
    ConditionsEditor,
    RewardsEditor,
    AutomationSelector,
    ConfirmDialog: () => import("../components/dialogs/ConfirmDialog.vue"),
    BooleanExpression,
    BooleanGroup,
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
      profile: null,
      saveSnack: false,
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
      this.dirty = false;
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

    const profile = YAML.parse(fileData);
    if (!profile.conditions) {
      profile.conditions = { operator: "any", operands: [] };
    }

    this.profile = profile;
  },
  watch: {
    profile: {
      deep: true,
      handler(newVal, oldVal) {
        if (oldVal != null) {
          this.dirty = true;
        }
      },
    },
  },
  async beforeRouteLeave(to, from, next) {
    if (!this.dirty) {
      return next();
    }
    if (
      await this.$refs.saveDlg.open(
        "Unsaved Changes",
        "Do you want to save your changes?",
        "Save Changes",
        "Discard Changes"
      )
    ) {
      await this.save();
    }
    return next();
  },
};
</script>

<style>
</style>