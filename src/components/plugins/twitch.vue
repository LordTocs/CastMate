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
import { mapGetters } from "vuex";
import { mapIpcs } from "../../utils/ipcMap";

export default {
  data() {
    return {
      channelWorking: false,
      botWorking: false,
    };
  },
  computed: {
    ...mapGetters("ipc", ["stateLookup"]),
    botName() {
      return this.stateLookup.twitch.botName;
    },
    channelName() {
      return this.stateLookup.twitch.channelName;
    },
  },
  methods: {
    ...mapIpcs("twitch", ["doChannelAuth", "doBotAuth"]),
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
};
</script>

<style scoped>
</style>