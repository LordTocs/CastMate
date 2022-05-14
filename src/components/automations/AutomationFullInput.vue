<template>
  <div>
    <div class="d-flex flex-row" style="height: 70vh">
      <div class="flex-grow-1 d-flex flex-column">
        <v-sheet color="grey darken-4" class="d-flex flex-row px-2 py-2">
          <v-tooltip bottom>
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                color="primary"
                dark
                fab
                small
                class="mr-4"
                @click="preview"
                v-bind="attrs"
                v-on="on"
              >
                <v-icon>mdi-play</v-icon>
              </v-btn>
            </template>
            <span>Preview Automation</span>
          </v-tooltip>
          <v-btn> Use Existing Automation </v-btn>
        </v-sheet>
        <flex-scroller class="flex-grow-1">
          <sequence-editor
            :value="actions"
            @input="updateActions"
            style="flex: 1"
          />
        </flex-scroller>
      </div>
      <flex-scroller color="grey darken-4" class="toolbox">
        <action-toolbox />
      </flex-scroller>
    </div>
  </div>
</template>

<script>
import ActionToolbox from "../actions/ActionToolbox.vue";
import FlexScroller from "../layout/FlexScroller.vue";
import SequenceEditor from "../sequences/SequenceEditor.vue";
import {
  generateEmptyAutomation,
  loadAutomation,
  saveAutomation,
} from "../../utils/fileTools";
import _cloneDeep from "lodash/cloneDeep";
export default {
  components: { ActionToolbox, SequenceEditor, FlexScroller },
  props: {
    value: {},
  },
  computed: {
    isInline() {
      return this.value instanceof Object;
    },
    actions() {
      if (this.isInline) {
        return this.value.actions;
      } else if (this.loadedAutomation) {
        return this.loadedAutomation.actions;
      }
      return [];
    },
  },
  data() {
    return {
      loadedAutomation: null,
      dirty: false,
    };
  },
  methods: {
    preview() {},
    async loadAutomation() {
      if (this.isInline) return;
      this.loadedAutomation = await loadAutomation(this.value);
      this.dirty = false;
    },
    updateActions(newActions) {
      if (!this.value) {
        //Assume inline.
        const newAuto = generateEmptyAutomation();
        newAuto.actions = newActions;
        this.$emit("input", newAuto);
      } else if (this.isInline) {
        const newAuto = _cloneDeep(this.value);
        newAuto.actions = newActions;
        this.$emit("input", newAuto);
      } else {
        this.loadAutomation.actions = newActions;
        this.dirty = true;
      }
    },
  },
  async mounted() {
    if (!this.isInline && this.value) {
      this.loadAutomation();
    }
  },
  watch: {
    value() {
      if (!this.isInline && this.value) {
        console.log("Loading via watch");
        this.loadAutomation();
      }
    },
  },
};
</script>

<style scoped>
.toolbox {
  width: 300px;
}
</style>