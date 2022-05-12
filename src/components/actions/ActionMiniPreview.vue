<template>
  <div class="d-flex flex-row align-center preview" v-if="automation">
    <action-mini-icon
      v-for="action in clampedActions"
      :key="action.id"
      :action="action"
      class="mx-1"
    />
    <span v-if="overflow">...</span>
  </div>
</template>

<script>
import ActionMiniIcon from "./ActionMiniIcon.vue";
export default {
  components: { ActionMiniIcon },
  props: {
    automation: {},
    maxActions: { type: Number, default: () => 5 },
  },
  computed: {
    clampedActions() {
      return this.automation.actions.slice(0, this.maxActions);
    },
    overflow() {
      return this.automation.actions.length > this.maxActions;
    },
  },
};
</script>

<style scoped>
.preview {
  overflow: hidden;
  white-space: nowrap;
  flex-grow: 0;
}
</style>