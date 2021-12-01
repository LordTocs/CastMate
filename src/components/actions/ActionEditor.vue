<template>
  <div class="action-card">
    <div class="action-card-body" v-if="actions[actionKey]">
      <table style="width: 100%">
        <data-input
          :value="value"
          @input="(v) => $emit('input', v)"
          :schema="actions[actionKey].data"
          :label="actions[actionKey].name || actionKey"
        />
      </table>
    </div>
    <div v-else>Unknown Action Key: {{ actionKey }}</div>
  </div>
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