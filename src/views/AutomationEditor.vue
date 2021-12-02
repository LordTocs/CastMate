<template>
  <div class="editor-base">
    <div class="editor-area">
      <div class="editor-area-scrollable">
        <v-card>
          <v-card-title>
            {{ automationName }}
          </v-card-title>
          <v-card-actions>
            <v-btn @click="saveAutomation"> Save </v-btn>
          </v-card-actions>
        </v-card>
        <sequence-editor
          v-if="automation"
          v-model="automation.actions"
          style="flex: 1"
        />
      </div>
    </div>
    <div class="editor-toolbox">
      <action-toolbox />
    </div>
  </div>
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

<style scoped>
.editor-base {
  display: flex;
  flex-direction: row;
  height: 100%;
}
.editor-area {
  flex: 1;
  position: relative;
}

.editor-area-scrollable {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: auto;
  /*padding-right: 20px;*/
  display: flex;
  flex-direction: column;
}

.editor-toolbox {
  width: 300px;
}
</style>