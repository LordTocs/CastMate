<template>
  <v-row>
    <v-col>
      <v-card>
        <v-card-title> Twitch Channel Account </v-card-title>
        <v-card-subtitle> Twitch Account of your Channel </v-card-subtitle>
        <v-card-text>
          <span v-if="channelName" class="text-h5">
            <v-avatar> <img :src="stateLookup.twitch.channelProfileUrl" :alt="channelName" /> </v-avatar>
            {{ channelName }}
          </span>
          <span v-else> Not Signed In </span>
        </v-card-text>
        <v-card-actions>
          <v-btn
            color="#9147FF"
            :loading="channelWorking"
            @click="startChannelAuth"
            v-if="!channelName"
          >
            Sign In
          </v-btn>
          <v-btn
            color="#5B4B72"
            :loading="channelWorking"
            @click="startChannelAuth"
            v-else
          >
            Sign In Again
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-col>
    <v-col>
      <v-card>
        <v-card-title> Twitch Bot Account </v-card-title>
        <v-card-subtitle> Twitch Account of your Chat Bot </v-card-subtitle>
        <v-card-text>
           <span v-if="botName" class="text-h5">
            <v-avatar> <img :src="stateLookup.twitch.botProfileUrl" :alt="botName" /> </v-avatar>
            {{ botName }}
          </span>
          <span v-else> Not Signed In </span>
        </v-card-text>
        <v-card-actions>
          <v-btn
            color="#9147FF"
            :loading="botWorking"
            @click="startBotAuth"
            v-if="!botName"
          >
            Sign In
          </v-btn>
          <v-btn
            color="#5B4B72"
            :loading="botWorking"
            @click="startBotAuth"
            v-else
          >
            Sign In Again
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