<template>
  <v-timeline-item right>
    <v-card :color="actionColor" :class="{ expanded, shrunk: !expanded }">
      <v-card-title
        v-if="firstAction"
        class="handle action-item-title"
        @click="expanded = !expanded"
      >
        <div style="flex-shrink: 0">
          {{ firstAction.name }}
        </div>

        <div class="data-preview">
          <data-view
            :value="firstActionData"
            :schema="firstAction.data"
            v-if="!expanded"
          />
        </div>
      </v-card-title>
      <v-card-title v-else-if="firstActionKey == 'import'">
        Import
      </v-card-title>
      <v-expand-transition>
        <v-card-text v-if="expanded">
          <action-editor
            :actionKey="firstActionKey"
            :value="firstActionData"
            @input="(v) => updateAction(firstActionKey, v)"
          />
        </v-card-text>
      </v-expand-transition>
      <v-expand-transition>
        <v-card-actions v-if="expanded">
          <v-btn color="red" @click="$emit('delete')"> Delete </v-btn>
        </v-card-actions>
      </v-expand-transition>
    </v-card>
  </v-timeline-item>
</template>

<script>
import { mapGetters } from "vuex";
import ActionEditor from "./ActionEditor.vue";
import DataView from "../data/DataView.vue";
export default {
  props: {
    value: {},
  },
  components: { ActionEditor, DataView },
  data() {
    return {
      expanded: false,
    };
  },
  computed: {
    ...mapGetters("ipc", ["actions"]),
    firstActionKey() {
      return Object.keys(this.value)[0];
    },
    firstActionData() {
      return this.value[this.firstActionKey];
    },
    firstAction() {
      return this.actions[this.firstActionKey];
    },
    actionColor() {
      return this.firstAction.color || "grey darken-2";
    },
  },
  methods: {
    updateAction(key, value) {
      let newValue = { ...this.value };

      newValue[key] = value;

      this.$emit("input", newValue);
    },
    newAction(key) {
      let newValue = { ...this.value, [key]: null };

      this.$emit("input", newValue);
    },
    deleteAction(key) {
      let newValue = { ...this.value };

      delete newValue[key];

      this.$emit("input", newValue);
    },
    onFocus() {
      console.log("Focus");
    },
    onBlur() {
      console.log("Blur");
    },
  },
};
</script>

<style scoped>
.action-editor {
  text-align: left;
  margin-bottom: 0.75rem;
  background-color: #efefef;
}
.action-card {
  margin-bottom: 0.75rem;
}

.shrunk {
  max-width: 600px;
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
</style>