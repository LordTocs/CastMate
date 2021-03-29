<template>
  <div style="text-align: left">
    <level style="margin-bottom: 18px">
      <div class="left">
        <h1>{{ pluginName }}</h1>
      </div>
      <div class="right">
        <el-button type="success" @click="save" style="width: 120px">
          <h3>Save</h3>
        </el-button>
      </div>
    </level>
    <component
      v-if="hasSettingsComponent"
      v-bind:is="settingsComponent"
      style="margin-bottom: 18px"
    />
    <el-card class="settings-card" v-if="settingsKeys.length > 0">
      <h3>Settings</h3>

      <div
        style="margin-bottom: 18px"
        v-for="settingKey in settingsKeys"
        :key="settingKey"
      >
        <data-input
          :schema="plugin.settings[settingKey]"
          :label="settingKey"
          :value="
            settings[pluginName] ? settings[pluginName][settingKey] : null
          "
          @input="(v) => setSettingsValue(settingKey, v)"
        />
      </div>
    </el-card>
    <el-card class="settings-card" v-if="secretKeys.length > 0">
      <div v-if="showSecrets">
        <level style="margin-bottom: 18px">
          <div class="left">
            <h3>Secrets</h3>
          </div>
          <div class="right">
            <el-button @click="showSecrets = !showSecrets">
              Hide Secrets
            </el-button>
          </div>
        </level>

        <div
          style="margin-bottom: 18px"
          v-for="secretKey in secretKeys"
          :key="secretKey"
        >
          <data-input
            :schema="plugin.secrets[secretKey]"
            :label="secretKey"
            :value="getSecretValue(secretKey)"
            @input="(v) => setSecretsValue(secretKey, v)"
          />
        </div>
      </div>
      <div v-else>
        <level style="margin-bottom: 18px">
          <div class="left">
            <h3>Secrets</h3>
          </div>
          <div class="right">
            <el-button @click="showSecrets = !showSecrets">
              Show Secrets
            </el-button>
          </div>
        </level>
      </div>
    </el-card>
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
    ...mapGetters("ipc", ["plugins"]),
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
      return () => import(`../components/plugins/${this.plugin.settingsView}`);
    },
  },
  methods: {
    setSettingsValue(key, value) {
      if (!this.settings[this.pluginName]) {
        this.settings[this.pluginName] = { [key]: value };
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

      await fs.promises.writeFile("./user/settings.yaml", newSettingsYaml);

      let newSecretsYaml = YAML.stringify(this.secrets);

      await fs.promises.writeFile(
        "./user/secrets/secrets.yaml",
        newSecretsYaml
      );
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
    };
  },
  async mounted() {
    const fullSettingsText = await fs.promises.readFile(
      "./user/settings.yaml",
      "utf-8"
    );
    const fullSettings = YAML.parse(fullSettingsText) || {};

    this.settings = fullSettings;

    const fullSecretsText = await fs.promises.readFile(
      "./user/secrets/secrets.yaml",
      "utf-8"
    );
    const fullSecrets = YAML.parse(fullSecretsText) || {};

    this.secrets = fullSecrets;
  },
};
</script>

<style scoped>
.settings-card {
  margin-bottom: 18px;
}
</style>