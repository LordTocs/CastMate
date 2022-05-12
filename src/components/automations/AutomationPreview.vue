<template>
  <div class="d-flex flex-row" v-if="automation">
    <v-chip class="ma-2" outlined v-if="!isInline">
      <v-icon left> mdi-flash </v-icon>
      {{ automation }}
    </v-chip>
    <action-mini-preview
      :automation="isInline ? automation : loadedAutomation"
    />
  </div>
</template>

<script>
import { loadAutomation } from "../../utils/fileTools";
import ActionMiniPreview from "../actions/ActionMiniPreview.vue";
export default {
  components: { ActionMiniPreview },
  props: {
    automation: {},
  },
  data() {
    return {
      loadedAutomation: null,
    };
  },
  computed: {
    isInline() {
      return this.automation instanceof Object;
    },
  },
  methods: {
    async loadAutomation() {
      this.loadedAutomation = await loadAutomation(this.automation);
    },
  },
  mounted() {
    if (this.automation && !this.isInline) {
      this.loadAutomation(); 
    }
  },
  watch: {
    automation() {
      if (this.isInline) {
        this.loadedAutomation = null;
      } else {
        this.loadAutomation();
      }
    },
  },
};
</script>

<style>
</style>