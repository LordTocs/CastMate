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
    ...mapGetters("spellcast", ["spellHooks"]),
    hook() {
      return this.spellHooks.find((b) => b._id == this.hookId);
    },
  },
};
</script>

<style>
</style>