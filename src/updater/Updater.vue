<template>
  <v-app style="max-height: 100vh">
    <system-bar :title="`Update Available - ${version}`" />
    <v-main style="max-height: 100%">
      <v-container fluid style="height: 100%" class="d-flex flex-column">
        <v-row class="flex-grow-0">
          <v-col>
            <v-card>
              <v-card-title> {{ releaseName }} </v-card-title>
            </v-card>
          </v-col>
        </v-row>
        <v-row class="flex-grow-1">
          <v-col>
            <v-card class="flex-grow-1 d-flex flex-column" style="height: 100%">
              <flex-scroller class="flex-grow-1">
                <v-card-text v-html="releaseNotes" />
              </flex-scroller>
            </v-card>
          </v-col>
        </v-row>
        <v-row class="flex-grow-0">
          <v-col>
            <v-card>
              <v-card-actions>
                <v-spacer />
                <v-btn color="primary" @click="doUpdate"> Update Now </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
    <v-footer app>
      <!-- -->
    </v-footer>
  </v-app>
</template>

<script>
import FlexScroller from "../components/layout/FlexScroller.vue";
import SystemBar from "../components/layout/SystemBar.vue";
import { ipcRenderer } from 'electron';
export default {
  components: { SystemBar, FlexScroller },
  data() {
    return {
      releaseDate: null,
      releaseName: null,
      releaseNotes: null,
      version: null,
    };
  },
  methods: {
      doUpdate() {
          ipcRenderer.invoke("updater.downloadUpdate")
      }
  },
  mounted() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);

    this.releaseDate = new Date(urlParams.get("releaseDate"));
    this.releaseName = urlParams.get("releaseName");
    this.releaseNotes = urlParams.get("releaseNotes");
    this.version = urlParams.get("version");
  },
};
</script>

<style>
html {
  overflow: hidden;
}

.v-main__wrap {
  bottom: 0;
  right: 0;
  overflow: auto;
}

/*Scroll Bars don't play nicely with the FABs so we shift it a little*/
.v-speed-dial--right {
  right: 32px;
}
.v-speed-dial--bottom {
  bottom: 32px;
}
.v-btn--fixed.v-btn--right {
  right: 32px;
}
.v-btn--fixed.v-btn--bottom {
  bottom: 32px;
}

::-webkit-scrollbar {
  background-color: #424242;
}

::-webkit-scrollbar-thumb {
  background: #616161;
}
</style>