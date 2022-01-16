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
          :value="actionData"
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
          :actionKey="actionKey"
          :plugin="actionPlugin"
          :value="actionData"
          @input="(v) => updateActionData(v)"
        />
      </v-card-text>
    </v-expand-transition>
  </v-card>
</template>

<script>
import { mapGetters } from "vuex";
import ActionEditor from "../actions/ActionEditor.vue";
import DataView from "../data/DataView.vue";
export default {
  props: {
    value: { type: Object, required: true },
    selected: { type: Boolean, default: () => false },
  },
  components: { ActionEditor, DataView },
  data() {
    return {
      expanded: false,
    };
  },
  computed: {
    ...mapGetters("ipc", ["plugins"]),
    actionKey() {
      return this.value ? this.value.action : undefined;
    },
    actionPlugin() {
      return this.value ? this.value.plugin : undefined;
    },
    actionData() {
      return this.value ? this.value.data : undefined;
    },
    actionDefinition() {
      const plugin = this.plugins[this.actionPlugin];
      if (plugin) {
        return plugin.actions[this.actionKey];
      }
      return undefined;
    },
    actionColor() {
      return this.actionDefinition?.color || "grey darken-2";
    },
  },
  methods: {
    updateActionData(newData) {
      let newValue = { ...this.value };

      newValue.data = newData;

      this.$emit("input", newValue);
    },
    toggleExpand() {
      this.expanded = !this.expanded;
      this.$emit("expanded", this.expanded);
    },
  },
};
</script>

<style scoped>
.shrunk {
  /*max-width: 600px;*/
}
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
}

.sequence-item i::selection {
  background: rgba(0,0,0,0);
}
</style>