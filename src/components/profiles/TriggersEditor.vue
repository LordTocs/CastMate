<template>
  <div>
    <trigger-editor
      v-for="triggerKey in Object.keys(value)"
      :key="triggerKey"
      v-model="value[triggerKey]"
      :triggerKey="triggerKey"
      :trigger="triggers[triggerKey]"
    />
    <div class="center-this">
      <el-popover v-model="triggerPop" placement="top">
        <trigger-selector @input="selectTrigger" :triggerDef="value" />
		<el-button slot="reference"> Add Trigger </el-button>
      </el-popover>
      
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import TriggerSelector from "../data/TriggerSelector.vue";
import TriggerEditor from "./TriggerEditor.vue";

export default {
  props: {
    value: {},
  },
  components: {
    TriggerEditor,
    TriggerSelector,
  },
  computed: {
    ...mapGetters("ipc", ["triggers"]),
  },
  data() {
    return {
      triggerPop: false,
    };
  },
  methods: {
    selectTrigger(trigger) {
      let newValue = { ...this.value, [trigger]: {} };

      this.$emit("input", newValue);

      this.triggerPop = false;
    },
  },
};
</script>

<style scoped>
.center-this {
	display: flex;
	flex-direction: row;
	justify-content: center;
}
</style>