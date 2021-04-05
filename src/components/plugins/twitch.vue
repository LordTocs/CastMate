<template>
  <v-row>
    <v-col>
      <v-card>
        <v-card-title> Twitch Channel Account </v-card-title>
        <v-card-subtitle> Twitch Account of your Channel </v-card-subtitle>
        <v-card-text>
          <span v-if="channelName">
            {{ channelName }}
          </span>
          <span v-else> Not Signed In </span>
        </v-card-text>
        <v-card-actions>
          <v-btn
            color="purple"
            :loading="channelWorking"
            @click="startChannelAuth"
          >
            Sign In
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-col>
    <v-col>
      <v-card>
        <v-card-title> Twitch Bot Account </v-card-title>
        <v-card-subtitle> Twitch Account of your Chat Bot </v-card-subtitle>
        <v-card-text>
          <span v-if="botName">
            {{ botName }}
          </span>
          <span v-else> Not Signed In </span>
        </v-card-text>
        <v-card-actions>
          <v-btn color="purple" :loading="botWorking" @click="startBotAuth">
            Sign In
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-col>
  </v-row>
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
</style>