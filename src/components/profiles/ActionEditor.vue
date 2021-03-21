<template>
  <el-card class="action-editor" shadow="never">
    <div
      slot="header"
      class="clearfix"
      style="display: flex; flex-direction: row"
    >
      <el-button> Delete </el-button>
    </div>
    <div
      v-for="actionKey in Object.keys(value)"
      :key="actionKey"
      class="action-card"
    >
      <div class="action-card-body" v-if="actions[actionKey]">
        <data-input
          v-model="value[actionKey]"
          :schema="actions[actionKey].data"
          :label="actions[actionKey].name || actionKey"
        />
      </div>
      <div v-else-if="actionKey == 'import'">
        Import: {{ value[actionKey] }}
      </div>
      <div v-else>Unknown Action Key: {{ actionKey }}</div>
    </div>
  </el-card>
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

<style scoped>
.action-editor {
  text-align: left;
  margin-bottom: 0.75rem;
}
.action-card {
  margin-bottom: 0.75rem;
}

.action-card-body {
  display: flex;
  flex-direction: row;
}
</style>