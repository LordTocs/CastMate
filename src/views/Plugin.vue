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
        <h1>{{ plugin.uiName || plugin.name }}</h1>
      </div>
    </v-sheet>
    <v-container fluid>
      <component
        v-if="hasSettingsComponent"
        v-bind:is="settingsComponent"
        style="margin-bottom: 18px"
      />
      <v-row v-if="settings && settingsKeys.length > 0">
        <v-col>
          <v-card>
            <v-card-title> Settings </v-card-title>

            <v-card-text>
              <data-input
                v-for="settingKey in settingsKeys"
                :key="settingKey"
                :schema="addRequired(plugin.settings[settingKey])"
                :label="settingKey"
                :value="settings[settingKey]"
                @input="(v) => setSettingsValue(settingKey, v)"
              />
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
      <v-row v-if="secrets && secretKeys.length > 0">
        <v-col>
          <v-card>
            <v-card-title> Secrets </v-card-title>

            <v-card-text v-if="showSecrets">
              <data-input
                v-for="secretKey in secretKeys"
                :key="secretKey"
                :schema="addRequired(plugin.secrets[secretKey])"
                :label="secretKey"
                :value="secrets[secretKey]"
                @input="(v) => setSecretsValue(secretKey, v)"
                secret
              />
            </v-card-text>
            <v-card-text v-else>
              <v-skeleton-loader
                boilerplate
                type="text"
                v-for="secretKey in secretKeys"
                :key="secretKey"
              ></v-skeleton-loader>
            </v-card-text>
            <v-card-actions>
              <v-btn @click="showSecrets = !showSecrets">
                {{ showSecrets ? "Hide Secrets" : "Show Secrets " }}
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
      <v-snackbar v-model="saveSnack" :timeout="1000" color="green">
        Saved
      </v-snackbar>
    </v-container>
    <confirm-dialog ref="saveDlg" />
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import DataInput from "../components/data/DataInput.vue";
import Level from "@/components/layout/Level.vue";
import fs from "fs";
import YAML from "yaml";

export default {
  computed: {
    ...mapGetters("ipc", ["plugins", "paths"]),
    pluginName() {
      return this.$route.params.pluginName;
    },
    plugin() {
      return this.plugins[this.pluginName];
    },
    settingsKeys() {
      return Object.keys(this.plugin.settings);
    },
    secretKeys() {
      return Object.keys(this.plugin.secrets);
    },
    hasSettingsComponent() {
      return !!this.plugin.settingsView;
    },
    settingsComponent() {
      return this.importSettingsView(this.plugin.settingsView);
    },
  },
  methods: {
    importSettingsView(viewName) {
      return () => import(`../components/plugins/${viewName}`);
    },
    setSettingsValue(key, value) {
      this.$set(this.settings, key, value);
    },
    setSecretsValue(key, value) {
      this.$set(this.secrets, key, value);
    },
    addRequired(schema) {
      return { ...schema, required: true };
    },
    async load() {
      const fullSettingsText = await fs.promises.readFile(
        this.paths.settingsFilePath,
        "utf-8"
      );
      const fullSettings = YAML.parse(fullSettingsText) || {};

      this.settings = fullSettings[this.pluginName] || {};

      const fullSecretsText = await fs.promises.readFile(
        this.paths.secretsFilePath,
        "utf-8"
      );
      const fullSecrets = YAML.parse(fullSecretsText) || {};

      this.secrets = fullSecrets[this.pluginName] || {};
    },
    async save() {
      const fullSettingsText = await fs.promises.readFile(
        this.paths.settingsFilePath,
        "utf-8"
      );
      const fullSettings = YAML.parse(fullSettingsText) || {};

      fullSettings[this.pluginName] = this.settings;

      let newSettingsYaml = YAML.stringify(fullSettings);

      await fs.promises.writeFile(this.paths.settingsFilePath, newSettingsYaml);

      const fullSecretsText = await fs.promises.readFile(
        this.paths.secretsFilePath,
        "utf-8"
      );
      const fullSecrets = YAML.parse(fullSecretsText) || {};

      fullSecrets[this.pluginName] = this.secrets;

      let newSecretsYaml = YAML.stringify(fullSecrets);

      await fs.promises.writeFile(this.paths.secretsFilePath, newSecretsYaml);

      this.trackAnalytic("saveSettings", { name: this.pluginName });

      this.saveSnack = true;
      this.dirty = false;
    },
    async routeGuard(next) {
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
  },
  components: {
    DataInput,
    Level,
    ConfirmDialog: () => import("../components/dialogs/ConfirmDialog.vue"),
  },
  data() {
    return {
      showSecrets: false,
      settings: null,
      secrets: null,
      saveSnack: false,
      dirty: false,
    };
  },
  watch: {
    settings: {
      deep: true,
      handler(newSettings, oldSettings) {
        if (oldSettings) {
          this.dirty = true;
        }
      },
    },
    secrets: {
      deep: true,
      handler(newSecrets, oldSecrets) {
        if (oldSecrets) {
          this.dirty = true;
        }
      },
    },
    pluginName: {
      async handler() {
        this.secrets = null;
        this.settings = null;
        this.dirty = false;
        this.load();
      },
    },
  },
  async mounted() {
    await this.load();
    this.trackAnalytic("accessSettings", { name: this.pluginName });
  },
  async beforeRouteLeave(to, from, next) {
    await this.routeGuard(next);
    this.dirty = false;
  },
  async beforeRouteUpdate(to, from, next) {
    await this.routeGuard(next);
    this.dirty = false;
  },
};
</script>

<style scoped>
</style>