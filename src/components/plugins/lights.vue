<template>
  <div class="hue-settings">
    <div v-if="!isConnected">
      To Connect, push button on hue bridge and then click Search
    </div>
    <div v-else>Connected to Hue Bridge</div>
    <el-button @click="startSearchForHub" v-if="!connecting">
      Search for HUE Hub
    </el-button>
    <div v-else>
		Searching ...
	</div>
  </div>
</template>

<script>
const { mapIpcs } = require("../../utils/ipcMap");

export default {
  data() {
    return {
      connecting: false,
      isConnected: false,
    };
  },
  methods: {
    ...mapIpcs("lights"),
    async startSearchForHub() {
      this.connecting = true;
      if (await this.searchForHub()) {
        this.isConnected = true;
      }
      this.connecting = false;
    },
  },
  async mounted() {
    this.isConnected = await this.getHubStatus();
  },
};
</script>

<style>
.hue-settings {
  display: flex;
  flex-direction: column;
  align-content: center;
}
</style>