<template>
  <v-container fluid>
    <action-toolbox />
    <v-row>
      <v-col>
        <v-card>
          <v-card-title>
            {{ automationName }}
          </v-card-title>
          <v-card-actions>
            <v-btn @click="saveAutomation"> Save </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <sequence-editor v-if="automation" v-model="automation.actions" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { mapGetters } from "vuex";
import ActionToolbox from "../components/actions/ActionToolbox.vue";
import SequenceEditor from "../components/sequences/SequenceEditor.vue";
import fs from "fs";
import path from "path";
import YAML from "yaml";

export default {
  components: {
    ActionToolbox,
    SequenceEditor,
  },
  data() {
    return {
      automation: null,
    };
  },
  computed: {
    ...mapGetters("ipc", ["paths", "plugins"]),
    automationName() {
      return this.$route.params.automation;
    },
    filePath() {
      return path.join(
        this.paths.userFolder,
        `automations/${this.automationName}.yaml`
      );
    },
  },
  methods: {
    async saveAutomation() {
      await fs.promises.writeFile(
        this.filePath,
        YAML.stringify(this.automation)
      );
    },
  },
  async mounted() {
    let fileData = await fs.promises.readFile(this.filePath, "utf-8");

    this.automation = YAML.parse(fileData);
  },
};
</script>

<style>
</style>