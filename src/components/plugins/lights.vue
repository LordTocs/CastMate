<template>
  <div>
    <span v-if="!isConnected">
      To Connect, push button on hue bridge and then click Search
    </span>
	<span v-else>
		Connected to Hue Bridge
	</span>
    <el-button @click="searchForHub"> Search for HUE Hub </el-button>
  </div>
</template>

<script>
const { ipcRenderer } = require("electron");

export default {
  data() {
    return {
      connecting: false,
      isConnected: false,
    };
  },
  methods: {
    async searchForHub() {
      this.connecting = true;
      if (await ipcRenderer.invoke("lightsSearchForHub")) {
        this.isConnected = true;
      }
      this.connecting = false;
    },
  },
  async mounted() {
    this.isConnected = await ipcRenderer.invoke("lightsGetHubStatus");
  },
};
</script>

<style>
</style>