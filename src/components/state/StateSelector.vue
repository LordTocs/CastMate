<template>
  <el-select :value="value" @input="(v) => $emit('input', v)" placeholder="State Variable">
    <el-option
      v-for="item in stateNames"
      :key="item"
      :label="item"
      :value="item"
    >
    </el-option>
  </el-select>
</template>

<script>
import { mapGetters } from "vuex";
export default {
  props: {
    value: {},
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