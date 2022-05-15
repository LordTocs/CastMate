<template>
  <div class="d-flex flex-row" v-if="automation">
    <action-mini-preview
      :automation="isInline ? automation : loadedAutomation"
      :maxActions="maxActions"
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
    maxActions: { type: Number, default: () => 5 },
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
    async reloadAutomation() {
      if (!this.automation || this.isInline) return;

      this.loadedAutomation = await loadAutomation(this.automation);
    },
  },
  mounted() {
    this.reloadAutomation();
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