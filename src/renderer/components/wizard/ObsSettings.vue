<template>
  <v-card>
    <v-card-text>
      <v-row>
        <v-col>
          <data-input
            :schema="addRequired(this.plugins.obs.settings.hostname)"
            label="Hostname"
            v-model="hostname"
          />
        </v-col>
        <v-col>
          <data-input
            :schema="addRequired(this.plugins.obs.settings.port)"
            label="Port"
            v-model="port"
          />
        </v-col>
      </v-row>
      <v-row>
        <v-col>
          <data-input
            :schema="addRequired(this.plugins.obs.secrets.password)"
            label="Password"
            v-model="password"
            secret
          />
        </v-col>
      </v-row>
    </v-card-text>
    <v-card-actions>
      <v-spacer />
      <v-btn :color="connected ? 'success' : 'primary'" :loading="trying" size="large" @click="tryConnect" variant="outlined"> {{ connected ? "Successfully Connected" : "Connect" }} </v-btn>
      <v-spacer />
    </v-card-actions>
  </v-card>
</template>

<script>
import fs from "fs";
import YAML from "yaml";
import { mapGetters } from "vuex";
import DataInput from "../data/DataInput.vue";
import { mapIpcs } from "../../utils/ipcMap";

export default {
  components: {
    DataInput,
  },
  data() {
    return {
      hostname: "localhost",
      port: 4444,
      password: null,
      connected: false,
      trying: false,
    };
  },
  computed: {
    ...mapGetters("ipc", ["plugins", "paths"]),
  },
  methods: {
    ...mapIpcs("obs", ["tryConnectSettings"]),
    addRequired(schema) {
      return { ...schema, required: true };
    },
    async save() {
      const fullSettingsText = await fs.promises.readFile(
        this.paths.settingsFilePath,
        "utf-8"
      );

      const fullSettings = YAML.parse(fullSettingsText) || {};

      if (!fullSettings.obs) {
        fullSettings.obs = {};
      }

      fullSettings.obs.hostname = this.hostname;
      fullSettings.obs.port = this.port;

      await fs.promises.writeFile(
        this.paths.settingsFilePath,
        YAML.stringify(fullSettings)
      );

      const fullSecretsText = await fs.promises.readFile(
        this.paths.secretsFilePath,
        "utf-8"
      );
      const fullSecrets = YAML.parse(fullSecretsText) || {};

      if (!fullSecrets.obs) {
        fullSecrets.obs = {};
      }

      fullSecrets.obs.password = this.password;

      await fs.promises.writeFile(
        this.paths.secretsFilePath,
        YAML.stringify(fullSecrets)
      );
    },

    async load() {
      const fullSettingsText = await fs.promises.readFile(
        this.paths.settingsFilePath,
        "utf-8"
      );
      const fullSettings = YAML.parse(fullSettingsText) || {};

      this.hostname = fullSettings?.obs?.hostname || "localhost";
      this.port = fullSettings?.obs?.port || 4444;

      const fullSecretsText = await fs.promises.readFile(
        this.paths.secretsFilePath,
        "utf-8"
      );
      const fullSecrets = YAML.parse(fullSecretsText) || {};

      this.password = fullSecrets?.obs?.password;
    },

    async tryConnect() {
        this.trying = true;
        const result = await this.tryConnectSettings(this.hostname, this.port, this.password);
        this.trying = false;

        if (result)
        {
            this.connected = true;
            await this.save();
        }
    }
  },
  async mounted() {
    await this.load();
  },
};
</script>

<style>
</style>