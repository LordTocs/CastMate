<template>
  <v-dialog persistent v-model="dialog" width="80%">
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
        <!--v-toolbar-title class="font-weight-bold grey--text"> </v-toolbar-title-->
        <v-spacer />
        <v-btn @click.stop="tryClear" class="mx-2"> Clear Actions </v-btn>
        <!--v-btn @click.stop="convertAutomation" class="mx-2">
          Convert to Automation
        </v-btn-->
      </v-toolbar>
      <v-card-text style="height: 70vh">
        <div class="d-flex flex-row" style="height: 100%">
          <flex-scroller class="flex-grow-1">
            <sequence-editor
              v-if="value"
              :value="value.actions"
              @input="updateActions"
              style="flex: 1"
            />
          </flex-scroller>
          <flex-scroller class="toolbox">
            <action-toolbox />
          </flex-scroller>
        </div>
      </v-card-text>
      <v-card-actions class="pt-3">
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          class="body-2 font-weight-bold"
          outlined
          @click.stop="ok"
        >
          Ok
        </v-btn>
      </v-card-actions>
    </v-card>
    <confirm-dialog ref="clearDlg" />
  </v-dialog>
</template>

<script>
import ConfirmDialog from "../dialogs/ConfirmDialog.vue";
import FlexScroller from "../layout/FlexScroller.vue";
import ActionToolbox from "../actions/ActionToolbox.vue";
import SequenceEditor from "../sequences/SequenceEditor.vue";
import { mapIpcs } from "../../utils/ipcMap";
import _cloneDeep from "lodash/cloneDeep";

export default {
  components: { ConfirmDialog, FlexScroller, ActionToolbox, SequenceEditor },
  props: {
    value: {},
  },
  data() {
    return {
      dialog: false,
      dirty: false,
    };
  },
  methods: {
    updateActions(newActions) {
      const newData = _cloneDeep(this.value);
      newData.actions = newActions;
      this.$emit("input", newData);
    },
    ok() {
      this.dialog = false;
    },
    async tryClear() {
      if (
        await this.$refs.clearDlg.open(
          "Confirm",
          "Are you sure you want to delete all these actions?"
        )
      ) {
        //Delete the command
        this.$emit("input", null);
        this.dialog = false;
      }
    },
    /*async convertAutomation() {

    },*/
    async open() {
      this.dialog = true;
    },
    ...mapIpcs("core", ["runActions"]),
    async preview() {
      await this.runActions(this.value.actions);
    },
  },
};
</script>

<style scoped>
.toolbox {
  width: 300px;
}
</style>