<template>
  <div>
    <div class="d-flex flex-row" style="height: 70vh">
      <div class="flex-grow-1 d-flex flex-column">
        <v-card-actions>
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
        </v-card-actions>
        <flex-scroller class="flex-grow-1">
          <sequence-editor :value="actions" style="flex: 1" />
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
export default {
  components: { ActionToolbox, SequenceEditor, FlexScroller },
  data() {
    return {
      actions: [],
    };
  },
  methods: {
    preview() {},
  },
};
</script>

<style scoped>
.toolbox {
  width: 300px;
}
</style>