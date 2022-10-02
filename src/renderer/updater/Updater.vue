<template>
  <v-app style="max-height: 100vh">
    <system-bar :title="`Update Available - ${version}`" />
    <v-main style="max-height: 100%">
      <v-container fluid style="height: 100%" class="d-flex flex-column">
        <v-card class="flex-grow-0 my-2" :title="releaseName" style="min-height: 30px;">
        </v-card>
        <v-card class="flex-grow-1 d-flex flex-column my-2">
          <flex-scroller class="flex-grow-1 px-3">
            <div class="flex-grow-1 px-6 py-6 text-body-1 release-notes" ref="releaseNotes" v-html="releaseNotes" ></div>
          </flex-scroller>
        </v-card>
        <v-card class="flex-grow-0 my-2" style="min-height: 30px;">
          <v-card-actions>
            <v-spacer />
            <v-btn variant="outlined" color="success" @click="doUpdate" :loading="updating"> Update Now </v-btn>
          </v-card-actions>
        </v-card>
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
import { nextTick } from "vue";
export default {
  components: { SystemBar, FlexScroller },
  data() {
    return {
      releaseDate: null,
      releaseName: null,
      releaseNotes: null,
      version: null,
      updating: false,
    };
  },
  methods: {
      async doUpdate() {
        this.updating = true;
        try {
          await ipcRenderer.invoke("updater.downloadUpdate")
        }
        catch(err) {
          this.updating = false;
        }
      }
  },
  mounted() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);

    this.releaseDate = new Date(urlParams.get("releaseDate"));
    this.releaseName = urlParams.get("releaseName");
    this.releaseNotes = urlParams.get("releaseNotes");
    this.version = urlParams.get("version");

    this.$nextTick(() => {
      //Github doesn't set target="_blank" on links. So we must do it manually. We have to do it in the next tick so releaseNotes gets rendered.
      if (!this.$refs.releaseNotes)
      {
        console.log("Could not find release notes");
        console.log(this.$refs)
        return;
      }

      const links = this.$refs.releaseNotes.querySelectorAll("a");
      for (let link of links) {
        link.target="_blank"
      }
    })
  },
};
</script>

<style>
html {
  overflow: hidden !important;
}

.v-main__wrap {
  bottom: 0;
  right: 0;
  overflow: auto;
}

.release-notes p {
  margin-bottom: 1rem;
}

.release-notes ul {
  margin-left: 2rem;
  margin-bottom: 1rem;
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