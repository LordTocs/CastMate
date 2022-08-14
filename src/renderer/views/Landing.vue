<template>
  <v-container fluid>
    <v-row>
      <v-col>
        <v-card height="100%" class="d-flex flex-column">
          <v-card-title> Twitch </v-card-title>
          <v-card-text class="flex-grow-1" v-if="!stateLookup.twitch.isAuthed">
            <v-alert dense variant="outlined" border="left" type="warning">
              <v-row align="center">
                <v-col class="grow">
                  To use twitch features with CastMate you must be signed in to
                  Twitch.
                </v-col>
                <v-col class="shrink">
                  <v-btn color="warning" variant="outlined" link to="/plugins/twitch" size="small">
                    Twitch Settings
                  </v-btn>
                </v-col>
              </v-row>
            </v-alert>
          </v-card-text>
          <v-card-text class="flex-grow-1" v-else>
            <v-row>
              <v-col>
                <strong> Channel: </strong>
                {{ stateLookup.twitch.channelName }} <br />
                <strong> Bot: </strong>
                {{ stateLookup.twitch.botName }}
              </v-col>
              <v-col>
                <strong> Viewers: </strong> {{ stateLookup.twitch.viewers }}
                <br />
                <strong> Followers: </strong>
                {{ stateLookup.twitch.followers }} <br />
                <strong> Subscribers: </strong>
                {{ stateLookup.twitch.subscribers }} <br />
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-actions v-if="stateLookup.twitch.isAuthed">
            <v-btn :href="`https://www.twitch.tv/dashboard/${stateLookup.twitch.channelName}`" target="_blank"
              variant="outlined" size="small" prepend-icon="mdi-twitch">
              Twitch Dashboard
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
      <v-col>
        <v-card height="100%" class="d-flex flex-column">
          <v-card-title> OBS </v-card-title>
          <v-card-text class="flex-grow-1" v-if="!stateLookup.obs.connected">
            <v-alert dense variant="outlined" border="left" type="warning">
              <v-row align="center">
                <v-col class="grow">
                  To use OBS features, you must connect over the
                  <a href="https://obsproject.com/forum/resources/obs-websocket-remote-control-obs-studio-from-websockets.466/"
                    target="_blank">obs-websocket</a>
                  plugin.
                </v-col>
                <v-col class="shrink">
                  <v-btn color="warning" variant="outlined" link to="/plugins/obs" size="small">
                    OBS Settings
                  </v-btn>
                </v-col>
              </v-row>
            </v-alert>
          </v-card-text>
          <v-card-text class="flex-grow-1" v-else>
            <strong> Streaming: </strong>
            <v-icon :color="stateLookup.obs.streaming ? 'blue' : undefined">{{
                stateLookup.obs.streaming
                  ? "mdi-broadcast"
                  : "mdi-broadcast-off"
            }}
            </v-icon>
            <br />
            <strong> Recording: </strong>
            <v-icon :color="stateLookup.obs.recording ? 'red' : undefined">{{ stateLookup.obs.recording ? "mdi-record" :
                "mdi-record"
            }}
            </v-icon>
            <br />
          </v-card-text>
          <v-card-actions>
            <v-btn v-if="stateLookup.obs.connected" @click="() => refereshAllBrowsers()" variant="outlined" prepend-icon="mdi-refresh">
              Refresh Browsers
            </v-btn>
            <v-btn v-if="!stateLookup.obs.connected" @click="() => openOBS()" prepend-icon="mdi-open-in-app">
              Launch OBS
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <active-profiles-card />
      </v-col>
    </v-row>
    <welcome-dialog ref="welcomeDlg" />
  </v-container>
</template>

<script>
import { mapGetters } from "vuex";
import ActiveProfilesCard from "../components/profiles/ActiveProfilesCard.vue";
import WelcomeDialog from "../components/wizard/WelcomeDialog.vue";
import { mapIpcs } from "../utils/ipcMap";
import { trackAnalytic } from "../utils/analytics.js";

export default {
  components: { ActiveProfilesCard, WelcomeDialog },
  computed: {
    ...mapGetters("ipc", ["stateLookup"]),
  },
  methods: {
    ...mapIpcs("obs", ["refereshAllBrowsers", "openOBS"]),
  },
  mounted() {
    trackAnalytic("accessDashboard");
  },
};
</script>

<style>
</style>