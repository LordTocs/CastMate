<template>
  <el-select :value="null" placeholder="Select" @input="(v) => $emit('input',v)">
    <el-option
      v-for="triggerKey in remainingTriggers"
      :key="triggerKey"
      :label="triggers[triggerKey].name || triggerKey"
      :value="triggerKey"
    >
    </el-option>
  </el-select>
</template>

<script>
import { mapGetters } from 'vuex';
export default {
	props: {
		value: {},
		triggerDef: {}
	},
	computed: {
		...mapGetters("ipc", ["triggers"]),
		remainingTriggers() {
			return Object.keys(this.triggers).filter((k) => !(this.triggerDef[k]))
		}
	}
};
</script>

<style>
</style>