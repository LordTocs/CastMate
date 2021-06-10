<template>
  <v-container fluid>
    <component
      v-if="hasSettingsComponent"
      v-bind:is="settingsComponent"
      style="margin-bottom: 18px"
    />
    <v-row v-if="settingsKeys.length > 0">
      <v-col>
        <v-card>
          <v-card-title> Settings </v-card-title>

          <v-card-text>
            <data-input
              v-for="settingKey in settingsKeys"
              :key="settingKey"
              :schema="plugin.settings[settingKey]"
              :label="settingKey"
              :value="
                settings[pluginName] ? settings[pluginName][settingKey] : null
              "
              @input="(v) => setSettingsValue(settingKey, v)"
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <v-row v-if="secretKeys.length > 0">
      <v-col>
        <v-card>
          <v-card-title> Secrets </v-card-title>

          <v-card-text v-if="showSecrets">
            <data-input
              v-for="secretKey in secretKeys"
              :key="secretKey"
              :schema="plugin.secrets[secretKey]"
              :label="secretKey"
              :value="getSecretValue(secretKey)"
              @input="(v) => setSecretsValue(secretKey, v)"
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
      return this.plugins.find((p) => p.name == this.pluginName);
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
      if (!this.settings[this.pluginName]) {
        this.$set(this.settings, this.pluginName, {});
        this.$set(this.settings[this.pluginName], key, value);
      } else {
        this.settings[this.pluginName][key] = value;
      }
    },
    getSecretValue(key) {
      return this.secrets[this.pluginName]
        ? this.secrets[this.pluginName][key]
        : null;
    },
    setSecretsValue(key, value) {
      if (!this.secrets[this.pluginName]) {
        this.$set(this.secrets, this.pluginName, {});
        this.$set(this.secrets[this.pluginName], key, value);
      } else {
        this.secrets[this.pluginName][key] = value;
      }
    },
    async save() {
      let newSettingsYaml = YAML.stringify(this.settings);

      await fs.promises.writeFile(this.paths.settingsFilePath, newSettingsYaml);

      let newSecretsYaml = YAML.stringify(this.secrets);

      await fs.promises.writeFile(this.paths.secretsFilePath, newSecretsYaml);

      this.saveSnack = true;
    },
  },
  components: {
    DataInput,
    Level,
  },
  data() {
    return {
      showSecrets: false,
      settings: {},
      secrets: {},
      saveSnack: false,
    };
  },
  async mounted() {
    const fullSettingsText = await fs.promises.readFile(
      this.paths.settingsFilePath,
      "utf-8"
    );
    const fullSettings = YAML.parse(fullSettingsText) || {};

    this.settings = fullSettings;

    const fullSecretsText = await fs.promises.readFile(
      this.paths.secretsFilePath,
      "utf-8"
    );
    const fullSecrets = YAML.parse(fullSecretsText) || {};

    this.secrets = fullSecrets;
  },
};
</script>

<style scoped>
</style>