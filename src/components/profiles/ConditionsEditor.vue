<template>
  <v-card>
    <v-card-title> Profile Conditions </v-card-title>
    <v-card-subtitle>
      If these conditions become true this profile and all it's triggers will
      become active
    </v-card-subtitle>
    <v-card-text>
      <conditional-editor
        :value="value"
        @input="(v) => $emit('input', v)"
        @delete="$emit('input', null)"
      />
    </v-card-text>
  </v-card>
</template>

<script>
import ConditionalEditor from "../conditionals/ConditionalEditor.vue";
export default {
  components: { ConditionalEditor },
  props: {
    value: {},
  },
  computed: {
    valueSafe() {
      if (!this.value) return {};
      return this.value;
    },
  },
};
</script>

<style scoped>
.conditions-editor {
  text-align: left;
}
</style>