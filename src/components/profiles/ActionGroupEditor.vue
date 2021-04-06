<template>
  <v-timeline-item right>
    <v-card color="grey darken-2">
      <v-card-title> {{ actions[firstActionKey].name }} </v-card-title>
      <v-card-text>
        <action-editor
          :actionKey="firstActionKey"
          :value="firstAction"
          @input="(v) => updateAction(firstActionKey, v)"
        />
      </v-card-text>
      <v-card-actions>
        <v-btn color="red" @click="$emit('delete')">
          Delete
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-timeline-item>
</template>

<script>
import { mapGetters } from "vuex";
import ActionEditor from "./ActionEditor.vue";
export default {
  props: {
    value: {},
  },
  components: { ActionEditor },
  computed: {
    ...mapGetters("ipc", ["actions"]),
    firstActionKey() {
      return Object.keys(this.value)[0];
    },
    firstAction() {
      return this.value[this.firstActionKey];
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
</style>