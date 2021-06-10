<template>
  <v-timeline-item right>
    <v-card :color="actionColor" :class="{ expanded, shrunk: !expanded }">
      <v-card-title
        v-if="actionDefinition"
        class="handle action-item-title"
        @click="expanded = !expanded"
      >
        <div style="flex-shrink: 0">
          {{ actionDefinition.name }}
        </div>

        <div class="data-preview">
          <data-view
            :value="actionData"
            :schema="actionDefinition.data"
            v-if="!expanded"
          />
        </div>
      </v-card-title>
      <v-card-title v-else-if="actionKey == 'import'"> Import </v-card-title>
      <v-expand-transition>
        <v-card-text v-if="expanded">
          <action-editor
            :actionKey="actionKey"
            :value="actionData"
            @input="(v) => updateAction(actionKey, v)"
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
import ActionEditor from "../actions/ActionEditor.vue";
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
  },
};
</script>

<style scoped>
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