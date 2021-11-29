<template>
  <v-card
    :color="actionColor"
    :class="{ expanded, shrunk: !expanded, 'sequence-item': true, selected }"
  >
    <!--class  action-item-title-->
    <v-card-title
      v-if="actionDefinition"
      class="handle"
      @click="expanded = !expanded"
    >
      <v-icon large left> {{ actionDefinition.icon }} </v-icon>
      {{ actionDefinition.name }}
    </v-card-title>
    <v-expand-transition>
      <v-card-subtitle class="handle" @click="expanded = !expanded">
        <data-view
          class="data-preview"
          :value="actionData"
          :schema="actionDefinition.data"
          v-if="!expanded"
        />
      </v-card-subtitle>
    </v-expand-transition>
    <v-expand-transition>
      <v-card-text v-if="expanded" class="grey darken-4" @click.stop="">
        <action-editor
          :actionKey="actionKey"
          :value="actionData"
          @input="(v) => updateAction(actionKey, v)"
        />
      </v-card-text>
    </v-expand-transition>

    <!--v-expand-transition>
      <v-card-actions v-if="expanded">
        <v-btn color="red" @click="$emit('delete')"> Delete </v-btn>
      </v-card-actions>
    </v-expand-transition-->
  </v-card>
</template>

<script>
import { mapGetters } from "vuex";
import ActionEditor from "../actions/ActionEditor.vue";
import DataView from "../data/DataView.vue";
export default {
  props: {
    value: {},
    selected: { type: Boolean, default: () => false }
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
  /*max-width: 600px;*/
}
.selected {
  border-color: #EFEFEF !important;
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
}
</style>