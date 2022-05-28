<template>
  <p>
    <span class="text--secondary" v-if="label"> {{ label }}: </span>
    {{ hook.name }}
  </p>
</template>

<script>
import { mapGetters } from "vuex";
export default {
  props: {
    hookId: {},
    label: {},
  },
  computed: {
    ...mapGetters("bitbuttons", ["buttonHooks"]),
    hook() {
      return this.buttonHooks.find((b) => b._id == this.hookId);
    },
  },
};
</script>

<style>
</style>