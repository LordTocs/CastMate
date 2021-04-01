<template>
  <div class="twitch-settings">
    <div class="twitch-column">
      <div class="twitch-label" v-if="channelName">
        Channel: {{ channelName }}
      </div>
      <div class="twitch-label" v-else>Not Authed</div>
      <div class="twitch-control">
        <el-button @click="startChannelAuth" v-if="!channelWorking">
          Authenicate With Channel
        </el-button>
        <span v-else> Connecting </span>
      </div>
    </div>
    <div class="twitch-column">
      <div class="twitch-label" v-if="channelName">Bot: {{ botName }}</div>
      <div class="twitch-label" v-else>Not Authed</div>
      <div class="twitch-control">
        <el-button @click="startBotAuth" v-if="!botWorking">
          Authenicate With Bot
        </el-button>
        <span v-else> Connecting </span>
      </div>
    </div>
  </div>
</template>

<script>
const { mapIpcs } = require("../../utils/ipcMap");

export default {
  data() {
    return {
      channelWorking: false,
      channelName: null,
      botName: null,
      botWorking: false,
    };
  },
  methods: {
    ...mapIpcs("twitch"),
    async startChannelAuth() {
      this.channelWorking = true;
      if (await this.doChannelAuth()) {
        this.hasChannelAuthed = true;
      }
      this.channelWorking = false;
    },
    async startBotAuth() {
      this.botWorking = true;
      if (await this.doBotAuth()) {
        this.hasBotAuthed = true;
      }
      this.botWorking = false;
    },
  },
  async mounted() {
    let { bot, channel } = await this.getAuthStatus();
    this.botName = bot;
    this.channelName = channel;
  },
};
</script>

<style scoped>
.twitch-settings {
  display: flex;
  flex-direction: row;
}

.twitch-column {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.twitch-label {
  text-align: center;
  margin-bottom: 18px;
}
.twitch-control {
  text-align: center;
}
</style>