<template>
  <v-card
    :color="actionColor"
    :class="{ expanded, shrunk: !expanded, 'sequence-item': true, selected }"
    tabindex="0"
  >
    <div class="d-flex flex-row">
      <v-sheet :color="darkerActionColor" class="d-flex flex-column justify-center handle" style="cursor: grab;">
        <v-icon size="x-large" class="mx-2"> mdi-drag </v-icon>
      </v-sheet>
      <div class="flex-grow-1">
        <v-card-title
          v-if="actionDefinition"
          @click.stop="toggleExpand"
        >
          <v-icon large left> {{ actionDefinition.icon }} </v-icon>
          {{ actionDefinition.name }}
        </v-card-title>
        <v-expand-transition>
          <v-sheet :color="actionColor">
            <v-card-subtitle @click.stop="toggleExpand">
              <data-view
                class="data-preview"
                :value="data"
                :schema="actionDefinition.data"
                v-if="!expanded"
              />
            </v-card-subtitle>
          </v-sheet>
        </v-expand-transition>
        <v-expand-transition>
          <v-sheet v-show="expanded" :color="darkestActionColor">
            <v-card-text
              class="grey darken-4"
              @click.stop=""
              @mousedown.stop=""
            >
                <action-editor
                  :actionKey="action"
                  :plugin="plugin"
                  v-model="data"
                />
            </v-card-text>
          </v-sheet>
        </v-expand-transition>
      </div>
    </div>
  </v-card>
</template>

<script>
import { mapGetters } from "vuex";
import { mapModelValues } from "../../utils/modelValue";
import ActionEditor from "../actions/ActionEditor.vue";
import DataView from "../data/DataView.vue";
import chromatism from "chromatism";

export default {
  props: {
    modelValue: { type: Object, required: true },
    selected: { type: Boolean, default: () => false },
  },
  emits: ["update:modelValue", "expanded"],
  components: { ActionEditor, DataView },
  data() {
    return {
      expanded: false,
    };
  },
  computed: {
    ...mapGetters("ipc", ["plugins"]),
    ...mapModelValues(["data", "plugin", "action"]),
    actionDefinition() {
      const plugin = this.plugins[this.plugin];
      if (plugin) {
        return plugin.actions[this.action];
      }
      return undefined;
    },
    actionColor() {
      return this.actionDefinition?.color;
    },
    darkActionColor() {
      return chromatism.shade(-10, this.actionColor).hex;
    },
    darkerActionColor() {
      return chromatism.shade(-20, this.actionColor).hex;
    },
    darkestActionColor() {
      return chromatism.shade(-30, this.actionColor).hex;
    }
  },
  methods: {
    toggleExpand() {
      this.expanded = !this.expanded;
      this.$emit("expanded", this.expanded);
    },
  },
};
</script>

<style scoped>
.selected {
  border-color: #efefef !important;
  border-width: 3px;
  border-style: solid;
}

.action-item-title {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
}

.data-preview {
  flex: 1;
  margin-left: 25px;
  min-width: 0;
}

.sequence-item {
  margin-bottom: 16px;
  margin-top: 16px;
  border-width: 3px;
  border-style: solid;
  user-select: none;
}

.sequence-item i::selection {
  background: rgba(0,0,0,0);
}
</style>