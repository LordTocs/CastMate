<template>
  <v-card
    :color="actionColor"
    :class="{ expanded, shrunk: !expanded, 'sequence-item': true, selected }"
  >
    <div style="font-size: 0; user-select: text">...</div>
    <v-card-title
      v-if="actionDefinition"
      class="handle"
      @click.stop="toggleExpand"
    >
      <v-icon large left> {{ actionDefinition.icon }} </v-icon>
      {{ actionDefinition.name }}
    </v-card-title>
    <v-expand-transition>
      <v-card-subtitle class="handle" @click.stop="toggleExpand">
        <data-view
          class="data-preview"
          :value="data"
          :schema="actionDefinition.data"
          v-if="!expanded"
        />
        <!-- This div is necessary so that there's "selectable content" otherwise the copy events wont fire -->
      </v-card-subtitle>
    </v-expand-transition>
    <v-expand-transition>
      <v-card-text
        v-if="expanded"
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
    </v-expand-transition>
  </v-card>
</template>

<script>
import { mapGetters } from "vuex";
import { mapModelValues } from "../../utils/modelValue";
import ActionEditor from "../actions/ActionEditor.vue";
import DataView from "../data/DataView.vue";
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