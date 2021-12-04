<template>
  <v-card
    :color="actionColor"
    :class="{ expanded, shrunk: !expanded, 'sequence-item': true, selected }"
  >
    <div style="font-size: 0; user-select: auto">...</div>
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
          :value="actionData"
          @input="(v) => updateAction(actionKey, v)"
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
    ...mapGetters("ipc", ["actions"]),
    actionKey() {
      return Object.keys(this.value)[0];
    },
    actionData() {
      return this.value[this.actionKey];
    },
    actionDefinition() {
      return this.actions[this.actionKey];
    },
    actionColor() {
      return this.actionDefinition.color || "grey darken-2";
    },
  },
  methods: {
    updateAction(key, value) {
      let newValue = { ...this.value };

      newValue[key] = value;

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
  user-select: none;
}
</style>