<template>
  <v-dialog
    persistent
    v-model="dialog"
    width="80%"
    @keydown.esc="cancel"
    @click:outside="cancel"
  >
    <v-card>
      <v-toolbar dense flat>
        <v-tooltip bottom>
          <template v-slot:activator="{ props }">
            <v-btn
              color="primary"
              dark
              fab
              small
              class="mr-4"
              @click="preview"
              v-bind="props"
            >
              <v-icon>mdi-play</v-icon>
            </v-btn>
          </template>
          <span>Preview Automation</span>
        </v-tooltip>
        <v-toolbar-title class="font-weight-bold grey--text">
          {{ automationName }}
        </v-toolbar-title>
        <v-spacer />
        <v-btn as="router-link" :to="`/automations/${automationName}`">
          Full Editor
        </v-btn>
      </v-toolbar>
      <v-card-text style="height: 70vh">
        <div class="d-flex flex-row" style="height: 100%">
          <flex-scroller class="flex-grow-1">
            <sequence-editor
              v-if="automation"
              v-model="automation.actions"
              style="flex: 1"
            />
          </flex-scroller>
          <div class="toolbox">
            <action-toolbox />
          </div>
        </div>
      </v-card-text>
      <v-card-actions class="pt-3">
        <v-spacer></v-spacer>
        <v-btn
          color="grey"
          text
          class="body-2 font-weight-bold"
          @click.stop="cancel"
        >
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          class="body-2 font-weight-bold"
          variant="outlined"
          @click.stop="save"
        >
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
    <confirm-dialog ref="saveDlg" />
  </v-dialog>
</template>

<script>
import path from "path";
import ConfirmDialog from "../dialogs/ConfirmDialog.vue";
import { mapGetters } from "vuex";
import FlexScroller from "../layout/FlexScroller.vue";
import ActionToolbox from "../actions/ActionToolbox.vue";
import SequenceEditor from "../sequences/SequenceEditor.vue";
import { mapIpcs } from "../../utils/ipcMap";

export default {
  components: { ConfirmDialog, FlexScroller, ActionToolbox, SequenceEditor },
  props: {
    automationName: { type: String },
  },
  data() {
    return {
      dialog: false,
      automation: null,
      dirty: false,
    };
  },
  computed: {
    ...mapGetters("ipc", ["paths"]),
    ...mapGetters("io", ["saveAutomation", "getAutomation"]),
    filePath() {
      return path.join(
        this.paths.userFolder,
        `automations/${this.automationName}.yaml`
      );
    },
  },
  methods: {
    async save() {
      await this.saveInternal();
      this.dirty = false;
      this.dialog = false;
    },
    async cancel() {
      await this.askToSave();
      this.automation = null;
      this.dirty = false;
      this.dialog = false;
    },
    async saveInternal() {
      await this.saveAutomation(this.automationName, this.automation);
      this.dirty = false;
    },
    async askToSave() {
      if (!this.dirty) return;

      if (
        await this.$refs.saveDlg.open(
          "Unsaved Changes",
          "Do you want to save your changes?",
          "Save Changes",
          "Discard Changes"
        )
      ) {
        await this.saveInternal();
      }
    },
    async open() {
      this.automation = await this.getAutomation(this.automationName);

      this.dialog = true;
    },
    ...mapIpcs("core", ["runActions"]),
    async preview() {
      await this.runActions(this.automation.actions);
    },
  },
  watch: {
    automation: {
      deep: true,
      handler(newAutomation, oldAutomation) {
        if (oldAutomation != null && newAutomation != null) {
          this.dirty = true;
        }
      },
    },
  },
};
</script>

<style scoped>
.toolbox {
  width: 300px;
}
</style>