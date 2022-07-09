<template>
  <div class="editor-base">
    <div class="d-flex flex-grow-1 flex-column">
      <v-sheet color="grey darken-4" class="py-4 px-4 d-flex">
        <div class="d-flex flex-column mx-4">
          <v-btn
            color="primary"
            fab
            dark
            class="my-1 align-self-center"
            @click="saveAutomation"
            :disabled="!dirty"
          >
            <v-icon>mdi-content-save</v-icon>
          </v-btn>
          <v-tooltip bottom>
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                color="primary"
                fab
                dark
                class="my-1 align-self-center"
                @click="preview"
                v-bind="attrs"
                v-on="on"
              >
                <v-icon>mdi-play</v-icon>
              </v-btn>
            </template>
            <span>Preview Automation</span>
          </v-tooltip>
        </div>

        <div class="flex-grow-1">
          <div class="d-flex">
            <h1 class="flex-grow-1">{{ automationName }}</h1>
            <v-tooltip bottom>
              <template v-slot:activator="{ on, attrs }">
                <div v-bind="attrs" v-on="on" style="width: min-content">
                  <v-switch
                    v-if="automation"
                    v-model="automation.sync"
                    label="Synchronous"
                  />
                </div>
              </template>
              <span
                >This automation will queue behind other Synchronous automations
                and wait to play.</span
              >
            </v-tooltip>
          </div>
          <v-text-field
            v-if="automation"
            v-model="automation.description"
            label="Description"
          />
        </div>
      </v-sheet>
      <flex-scroller class="flex-grow-1">
        <sequence-editor
          v-if="automation"
          v-model="automation.actions"
          style="flex: 1"
        />
      </flex-scroller>
    </div>
    <div class="editor-toolbox">
      <action-toolbox />
    </div>
    <confirm-dialog ref="saveDlg" />
    <v-snackbar v-model="saveSnack" :timeout="1000" color="green">
      Saved
    </v-snackbar>
  </div>
</template>

<script>
import ActionToolbox from "../components/actions/ActionToolbox.vue";
import SequenceEditor from "../components/sequences/SequenceEditor.vue";
import { mapIpcs } from "../utils/ipcMap";
import ConfirmDialog from "../components/dialogs/ConfirmDialog.vue";
import FlexScroller from "../components/layout/FlexScroller.vue";
import { loadAutomation, saveAutomation } from "../utils/fileTools";
import { trackAnalytic } from "../utils/analytics.js";

export default {
  components: {
    ActionToolbox,
    SequenceEditor,
    ConfirmDialog,
    FlexScroller,
  },
  data() {
    return {
      automation: null,
      dirty: false,
      saveSnack: false,
    };
  },
  computed: {
    automationName() {
      return this.$route.params.automation;
    },
  },
  methods: {
    ...mapIpcs("core", ["runActions"]),
    async saveAutomation() {
      await saveAutomation(this.automationName, this.automation);
      this.dirty = false;
      this.saveSnack = true;
    },
    async preview() {
      await this.runActions(this.automation.actions);
    },
  },
  async mounted() {
    this.automation = await loadAutomation(this.automationName);

    trackAnalytic("accessAutomation", { name: this.automationName });
  },
  watch: {
    automation: {
      deep: true,
      handler(newAutomation, oldAutomation) {
        if (oldAutomation != null) {
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
      await this.saveAutomation();
    }
    return next();
  },
};
</script>

<style scoped>
.editor-base {
  display: flex;
  flex-direction: row;
  height: 100%;
}

.editor-toolbox {
  width: 300px;
}
</style>