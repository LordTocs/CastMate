<template>
  <v-app style="max-height: 100vh">
    <system-bar title="CastMate" />
    

    <v-navigation-drawer app v-model="navDrawer" style="-webkit-app-region: no-drag" v-if="loaded">
      <v-list-item link to="/">
        <v-list-item-title> 
          <img src="./assets/logo-mark-dark.svg" style="height: 2.5em" class="my-1"> 
        </v-list-item-title>
      </v-list-item>

      <v-divider></v-divider>

      <v-list dense nav>
        <v-list-item link to="/profiles" prepend-icon="mdi-card-account-details-outline" title="Profiles" />
        <v-list-item link to="/automations" prepend-icon="mdi-flash" title="Automations" />
        <v-divider></v-divider>
        <v-list-item link to="/segments" prepend-icon="mdi-tag" title="Segments" />
        <v-list-item link to="/variables" prepend-icon="mdi-variable" title="Variables" />
        <v-list-item link to="/rewards" prepend-icon="mdi-star-circle-outline" title="Rewards" />
        <v-divider></v-divider>
        <v-list-group n-action class="settings">
          <template #activator="{ props }">
            <v-list-item v-bind="props" prepend-icon="mdi-cog" title="Settings" />
          </template>

          <v-list-item v-for="plugin in uiPlugins" :to="`/plugins/${plugin.name}`" :key="plugin.name"
            :prepend-icon="plugin.icon ? plugin.icon : 'mdi-view-dashboard'" :title="plugin.uiName" />

        </v-list-group>
        <v-divider></v-divider>
        <v-list-item @click="openSoundsFolder" prepend-icon="mdi-folder-music" title="Open Sounds Folder" />
        <v-list-item link to="/about" prepend-icon="mdi-information-outline" title="About" />
      </v-list>
    </v-navigation-drawer>

    <v-app-bar dense app v-if="loaded">
      <v-app-bar-nav-icon @click="navDrawer = !navDrawer"></v-app-bar-nav-icon>

      <v-toolbar-title> {{ $route.name }}</v-toolbar-title>

      <v-spacer></v-spacer>
    </v-app-bar>

    <v-main style="max-height: 100%; overflow: auto;" v-if="loaded">
      <router-view></router-view>
    </v-main>
    <v-main style="max-height: 100%" v-else>
      <v-container fluid style="height: 100%">
        <v-row justify="center">
          <v-col cols="12" sm="4" style="justify-content: center; text-align: center">
            <h1>Loading CastMate</h1>
            <v-progress-circular indeterminate color="cyan" :size="100" :width="15" />
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
import { mapGetters, mapActions } from "vuex";
import SystemBar from "./components/layout/SystemBar.vue";
import path from "path";
import { shell } from "electron";

export default {
  components: {
    SystemBar,
  },
  data() {
    return {
      navDrawer: null,
      loaded: false,
    };
  },
  computed: {
    ...mapGetters("ipc", ["inited", "pluginList", "paths"]),
    uiPlugins() {
      return this.pluginList
        .filter(
          (p) =>
            p.settingsView ||
            Object.keys(p.settings).length > 0 ||
            Object.keys(p.secrets).length > 0
        )
        .sort((a, b) => {
          let astr = a.uiName.toUpperCase();
          let bstr = b.uiName.toUpperCase();
          if (astr < bstr) return -1;
          if (astr > bstr) return 1;
          return 0;
        });
    },
  },
  methods: {
    ...mapActions("ipc", ["init"]),
    ...mapActions("rewards", ["loadRewards"]),
    ...mapActions("segments", ["loadSegments"]),
    ...mapActions("variables", ["loadVariables"]),
    openSoundsFolder() {
      shell.openPath(path.join(this.paths.userFolder, "sounds"));
    },
  },
  async mounted() {
    await this.init();
    await this.loadRewards();
    await this.loadSegments();
    await this.loadVariables();
    this.loaded = true;
    //ipcRenderer.invoke("updater.checkForUpdates");
  },
};
</script>

<style>
html {
  overflow: hidden !important;
}

/*
.v-main {
  bottom: 0;
  right: 0;
  overflow: auto;
} */

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

.settings .v-list-item {
    --indent-padding: 0px !important;
}
</style>
