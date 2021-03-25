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
    <el-card v-if="settingsKeys.length > 0">
      <h3>Settings</h3>

      <div
        style="margin-bottom: 18px"
        v-for="settingKey in settingsKeys"
        :key="settingKey"
      >
        <data-input :schema="plugin.settings[settingKey]" :label="settingKey" />
      </div>
    </el-card>
	<el-card v-if="secretKeys.length > 0">
      <h3>Secrets</h3>

      <div
        style="margin-bottom: 18px"
        v-for="secretKey in secretKeys"
        :key="secretKey"
      >
        <data-input :schema="plugin.secrets[secretKey]" :label="secretKey" />
      </div>
    </el-card>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import DataInput from "../components/data/DataInput.vue";
import Level from "@/components/layout/Level.vue";

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
  },
  components: {
    DataInput,
    Level,
  },
};
</script>

<style scoped>
</style>