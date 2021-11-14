<template>
  <v-container fluid>
    <action-toolbox />
    <p>{{ triggerKey }} : {{ commandKey }}</p>
  </v-container>
</template>

<script>
import { mapGetters } from "vuex";
import ActionToolbox from "../components/actions/ActionToolbox.vue";
export default {
  components: {
    ActionToolbox,
  },
  computed: {
    ...mapGetters("profile", ["profile", "profileName"]),
    triggerKey() {
      return this.$route.params.trigger;
    },
    commandKey() {
      return this.$route.params.command;
    },
  },
};
</script>

<style>
</style>