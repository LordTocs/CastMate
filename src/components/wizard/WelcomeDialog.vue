<template>
  <v-dialog persistent v-model="dialog" width="80%" @keydown.esc="cancel">
    <v-card>
      <p class="text-center text-h2" v-if="stage == 'welcome'">
        Welcome to CastMate!
      </p>
      <v-card-title class="text-center" v-if="stage == 'twitch'">
        <h1>
          Sign Into <img src="../../assets/twitchLogo.png" class="twitchLogo" />
        </h1>
      </v-card-title>
      <v-card-title class="text-center" v-if="stage == 'obs'">
        <h1>
          Configure OBS Websocket
          <img src="../../assets/obsws_logo.png" class="obsWSLogo" />
        </h1>
      </v-card-title>
      <v-card-title v-if="stage == 'done'">
        <h1>You're ready to start creating with CastMate!</h1>
      </v-card-title>
      <v-card-text v-if="stage == 'welcome'">
        <p class="text-h5 text-center">Thank you for downloading CastMate!</p>
        <div class="d-flex flex-row justify-center my-4">
          <img
            src="../../assets/icons/icon.png"
            style="width: 300px; height: auto; border-radius: 10px"
          />
        </div>
        <v-card-actions>
          <v-spacer />
          <v-btn x-large color="primary" @click="moveNext"> Get Started </v-btn>
          <v-spacer />
        </v-card-actions>
      </v-card-text>
      <v-card-text v-if="stage == 'twitch'">
        <span class="text-h5"> CastMate needs you to sign into twitch. </span>
        <br />
        <span class="text-h6">
          Sign into your channel account and optionally a chat bot account.
        </span>
        <twitch />
      </v-card-text>
      <v-card-text v-if="stage == 'obs'">
        <span class="text-h5">You need to connect CastMate to OBS.</span>
        <br />
        <span class="text-h6">
          CastMate connects through the OBS-Websocket plugin.
        </span>
        <br />
        <span class="text-h6">
          If you don't already have it installed you can download the installer
          <a
            href="https://github.com/obsproject/obs-websocket/releases/tag/4.9.1"
            target="_"
          >
            here.
          </a>
        </span>
        <hr class="my-4" />
        <div class="my-3">
          <span class="text-h6">
            Once you've installed OBS-Websocket you can configure it in OBS.
          </span>
        </div>
        <v-row>
          <v-col class="d-flex flex-column justify-center text-center">
            Go to the Tools -> WebSockets Server Settings
          </v-col>
          <v-col>
            <img src="../../assets/websocketSettings.png" />
          </v-col>
          <v-col class="d-flex flex-column justify-center text-center">
            Here you'll find the port and password CastMate needs. If you
            haven't already you should set a password. It keeps your OBS secure.
          </v-col>
          <v-col>
            <div></div>
            <img src="../../assets/websocket.png" />
          </v-col>
        </v-row>
        <hr class="my-4" />
        <span class="text-h6"> Enter Your OBS Websocket Settings </span>
        <br />
        <span>
          Match the port and password you set in OBS. Leave hostname as
          "localhost" unless you know what you're doing!
        </span>
        <obs-settings />
      </v-card-text>
      <v-card-text v-if="stage == 'done'">
        <span class="text-h5">
          CastMate uses a profile system to set up "Triggers". Triggers let you
          set what should happen when certain events occurs. Events such as a
          chat command, a raid, someone follows, or someone subscribes. To get
          started setting up a chat command first create a profile.
        </span>
        <img src="../../assets/triggers.png" />
        <span class="text-h5">
          CastMate uses "Automations" to determine what should happen when a
          trigger is activated. Automations are a sequence of actions. Actions
          are things like playing a sound, toggling an OBS filter, changing your
          lights color, or running text to speech.
        </span>
        <img
          src="../../assets/automation.png"
          style="width: 98%; height: auto"
        />
      </v-card-text>
      <v-card-actions v-if="stage != 'welcome' && stage != 'done'">
        <v-btn small @click="moveNext"> Skip </v-btn>
        <v-spacer />
        <v-btn color="primary" :disabled="!ready" @click="moveNext">
          Next
        </v-btn>
      </v-card-actions>
      <v-card-actions v-if="stage == 'done'">
        <v-spacer />
        <v-btn x-large color="primary" @click="cancel"> Get Creating </v-btn>
        <v-spacer />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { mapGetters } from "vuex";
import Twitch from "../plugins/twitch.vue";
import ObsSettings from "./ObsSettings.vue";
import { isFirstRun } from "../../utils/firstRun";
export default {
  components: { Twitch, ObsSettings },
  data() {
    return {
      dialog: false,
      stage: "welcome",
    };
  },
  computed: {
    ...mapGetters("ipc", ["stateLookup", "paths"]),
    signedIn() {
      return !!this.stateLookup.twitch.channelName;
    },
    obsConnected() {
      return this.stateLookup.obs.connected;
    },
    ready() {
      return (
        this.stage == "welcome" ||
        (this.stage == "twitch" && this.signedIn) ||
        (this.stage == "obs" && this.obsConnected)
      );
    },
  },
  methods: {
    open() {
      this.dialog = true;
    },
    moveNext() {
      if (this.stage == "welcome") {
        this.stage = "twitch";
        return;
      }
      if (this.stage == "twitch") {
        this.stage = "obs";
        return;
      }
      if (this.stage == "obs") {
        this.stage = "done";
        return;
      }
    },
    cancel() {
      this.dialog = false;
    },
  },
  async mounted() {
    if (await isFirstRun(this.paths.userFolder)) {
      this.open();
    }
  },
};
</script>

<style scoped>
.twitchLogo {
  height: 1em;
  display: inline-block;
  position: relative;
  bottom: -0.275em;
}
.obsWSLogo {
  height: 1em;
  display: inline-block;
}
</style>