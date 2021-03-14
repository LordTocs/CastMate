<template>
  <div>
    <div v-for="actionKey in Object.keys(value)" :key="actionKey">
      <div v-if="actions[actionKey]">
        {{ actions[actionKey].name || actionKey }}
        <data-input
          v-model="value[actionKey]"
          :schema="actions[actionKey].data"
        />
      </div>
      <div v-else>Unknown Action Key: {{ actionKey }}</div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import DataInput from "../data/DataInput.vue";
export default {
  props: {
    value: {},
  },
  components: { DataInput },
  computed: {
    ...mapGetters("ipc", ["actions"]),
  },
};
</script>

<style>
</style>