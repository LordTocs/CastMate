<template>
  <el-card class="action-editor" shadow="never">
    <level
      slot="header"
      class="clearfix"
      style="display: flex; flex-direction: row"
    >
      <div class="right">
        <el-button @click="$emit('moveUp')"> Up </el-button>
        <el-button @click="$emit('moveDown')"> Down </el-button>
        <el-button @click="$emit('delete')"> Delete </el-button>
      </div>
    </level>

    <div v-for="(actionKey, i) in Object.keys(value)" :key="i">
      <action-editor
        :actionKey="actionKey"
        :value="value[actionKey]"
        @input="(v) => updateAction(actionKey, v)"
        @delete="deleteAction(actionKey)"
      />
    </div>
    <level>
      <div class="left">
        <el-select
          :value="null"
          placeholder="Select"
          @input="(v) => newAction(v)"
        >
          <el-option
            v-for="actionKey in Object.keys(actions)"
            :key="actionKey"
            :label="actions[actionKey].name || actionKey"
            :value="actionKey"
          >
          </el-option>
        </el-select>
      </div>
      <div class="right"></div>
    </level>
  </el-card>
</template>

<script>
import { mapGetters } from "vuex";
import Level from "../layout/Level";
import ActionEditor from "./ActionEditor.vue";
export default {
  props: {
    value: {},
  },
  components: { Level, ActionEditor },
  computed: {
    ...mapGetters("ipc", ["actions"]),
  },
  methods: {
    updateAction(key, value) {
      let newValue = { ...this.value };

      newValue[key] = value;

      this.$emit("input", newValue);
    },
    newAction(key) {
      let newValue = { ...this.value, [key]: null };

      this.$emit("input", newValue);
    },
    deleteAction(key) {
      let newValue = { ...this.value };

      delete newValue[key];

      this.$emit("input", newValue);
    },
  },
};
</script>

<style scoped>
.action-editor {
  text-align: left;
  margin-bottom: 0.75rem;
  background-color: #efefef;
}
.action-card {
  margin-bottom: 0.75rem;
}

.action-card-body {
}
</style>