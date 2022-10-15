<template>
    <action-mini-preview
      v-if="automation"
      :automation="isInline ? automation : loadedAutomation"
      :maxActions="maxActions"
    />
</template>

<script>
import { mapIpcs } from "../../utils/ipcMap";
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
    ...mapIpcs("io", ["getAutomation"]),
    async reloadAutomation() {
      if (!this.automation || this.isInline) return;

      this.loadedAutomation = await this.getAutomation(this.automation);
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
        this.reloadAutomation();
      }
    },
  },
};
</script>

<style>
</style>