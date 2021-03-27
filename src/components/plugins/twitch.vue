<template>
  <div>
    <el-button @click="doChannelAuth">
      Authenicate With Channel
    </el-button>
    <el-button @click="doBotAuth">
      Authenicate With Bot
    </el-button>
  </div>
</template>

<script>
const { ipcRenderer } = require("electron");

export default {
  data() {
    return {
      channelWorking: false,
      hasChannelAuthed: false,
      botWorking: false,
      hasBotAuthed: false,
    };
  },
  methods: {
    async doChannelAuth() {
      this.channelWorking = true;
      if (await ipcRenderer.invoke("twitchDoChannelAuth")) {
        this.hasChannelAuthed = true;
      }
      this.channelWorking = false;
    },
    async doBotAuth() {
      this.botWorking = true;
      if (await ipcRenderer.invoke("twitchDoBotAuth")) {
        this.hasBotAuthed = true;
      }
      this.botWorking = false;
    },
  },
  async mounted() {
    let { bot, channel } = await ipcRenderer.invoke("twitchGetAuthStatus");

    if (bot) {
      this.hasBotAuthed = true;
    }
    if (channel) {
      this.hasChannelAuthed = true;
    }
  },
};
</script>

<style>
</style>