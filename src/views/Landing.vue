<template>
  <v-container fluid>
    <v-row>
      <v-col>
        <v-card height="100%" class="d-flex flex-column">
          <v-card-title> Twitch </v-card-title>
          <v-card-text class="flex-grow-1" v-if="!stateLookup.twitch.isAuthed">
            <v-alert dense outlined border="left" type="warning">
              <v-row align="center">
                <v-col class="grow">
                  To use twitch features with CastMate you must be signed in to
                  Twitch.
                </v-col>
                <v-col class="shrink">
                  <v-btn
                    color="warning"
                    outlined
                    link
                    to="/plugins/twitch"
                    small
                  >
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
                <strong> Followers: </strong> {{ stateLookup.twitch.followers}} <br />
                <strong> Subscribers: </strong> {{ stateLookup.twitch.subscribers}} <br />
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-actions v-if="stateLookup.twitch.isAuthed">
            <v-btn :href="`https://www.twitch.tv/dashboard/${stateLookup.twitch.channelName}`" target="_blank"> Twitch Dashboard </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
      <v-col>
        <v-card height="100%" class="d-flex flex-column">
          <v-card-title> OBS </v-card-title>
          <v-card-text class="flex-grow-1" v-if="!stateLookup.obs.connected">
            <v-alert dense outlined border="left" type="warning">
              <v-row align="center">
                <v-col class="grow">
                  To use OBS features, you must connect over the
                  <a
                    href="https://obsproject.com/forum/resources/obs-websocket-remote-control-obs-studio-from-websockets.466/"
                    target="_blank"
                    >obs-websocket</a
                  >
                  plugin.
                </v-col>
                <v-col class="shrink">
                  <v-btn color="warning" outlined link to="/plugins/obs" small>
                    OBS Settings
                  </v-btn>
                </v-col>
              </v-row>
            </v-alert>
          </v-card-text>
          <v-card-text class="flex-grow-1" v-else>
            <strong> Streaming: </strong> {{ stateLookup.obs.streaming }} <br />
            <strong> Recording: </strong> {{ stateLookup.obs.recording }} <br />
          </v-card-text>
          <v-card-actions>
            <v-btn @click="refereshAllBrowsers"> Refresh Browsers </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <active-profiles-card />
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { mapGetters } from "vuex";
import ActiveProfilesCard from "../components/profiles/ActiveProfilesCard.vue";
import { mapIpcs } from '../utils/ipcMap';
export default {
  components: { ActiveProfilesCard },
  computed: {
    ...mapGetters("ipc", ["stateLookup"]),
  },
  methods: {
    ...mapIpcs("obs", ["refereshAllBrowsers"])
  }
};
</script>

<style>
</style>