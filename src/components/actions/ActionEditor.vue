<template>
  <data-input
    :value="value"
    @input="(v) => $emit('input', v)"
    :schema="actions[actionKey].data"
    :label="actions[actionKey].name || actionKey"
  />
</template>

<script>
import { mapGetters } from "vuex";
import DataInput from "../data/DataInput.vue";

export default {
  props: {
    value: {},
    actionKey: {},
  },
  components: { DataInput },
  computed: {
    ...mapGetters("ipc", ["actions"]),
  },
};
</script>

<style>
.action-card {
  margin-bottom: 0.75rem;
}

.action-card-body {
  display: flex;
  flex-direction: row;
}
</style>