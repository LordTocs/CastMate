<template>
  <v-select
    :value="value"
    @change="(v) => $emit('input', v)"
    :label="label"
    :items="stateNames"
  />
</template>

<script>
import { mapGetters } from "vuex";
export default {
  props: {
    value: {},
    label: {},
  },
  data() {
    return {
      stateNames: [],
    };
  },
  computed: {
    ...mapGetters("ipc", ["client"]),
  },
  async mounted() {
    let state = await this.client.getCombinedState();

    this.stateNames = Object.keys(state);
  },
};
</script>

<style>
</style>