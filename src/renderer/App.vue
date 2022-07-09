<template>
  <v-app style="max-height: 100vh">
    <system-bar title="CastMate" />
    <v-app-bar dense app v-if="loaded">
      <v-app-bar-nav-icon @click="navDrawer = !navDrawer"></v-app-bar-nav-icon>

      <v-toolbar-title> {{ $route.name }}</v-toolbar-title>

      <v-spacer></v-spacer>
    </v-app-bar>

    <v-navigation-drawer app v-model="navDrawer" style="-webkit-app-region: no-drag" v-if="loaded">
      <v-list-item link to="/">
        <v-list-item-title class="title"> CastMate </v-list-item-title>
        <!--v-list-item-subtitle> subtext </v-list-item-subtitle-->
      </v-list-item>

      <v-divider></v-divider>

      <v-list dense nav>
        <v-list-item link to="/profiles">
          <v-list-item-icon icon="mdi-card-account-details-outline" />

          <v-list-item-title> Profiles </v-list-item-title>
        </v-list-item>

        <v-list-item link to="/automations">
          <v-list-item-icon icon="mdi-flash" />

          <v-list-item-title> Automations </v-list-item-title>
        </v-list-item>

        <v-divider></v-divider>

        <v-list-item link to="/segments">
          <v-list-item-icon icon="mdi-tag" />
          <v-list-item-title> Segments </v-list-item-title>
        </v-list-item>

        <v-list-item link to="/variables">
          <v-list-item-icon icon="mdi-variable" />

          <v-list-item-title> Variables </v-list-item-title>
        </v-list-item>

        <v-list-item link to="/rewards">
          <v-list-item-icon icon="mdi-star-circle-outline" />

          <v-list-item-title> Rewards </v-list-item-title>
        </v-list-item>

        <v-divider></v-divider>
        <v-list-group n-action>
          <template v-slot:activator>
            <v-list-item-icon icon="mdi-cog" />

            <v-list-item-title> Settings</v-list-item-title>
          </template>

          <v-list-item v-for="plugin in uiPlugins" :to="`/plugins/${plugin.name}`" :key="plugin.name">
            <v-list-item-icon :icon="plugin.icon ? plugin.icon : 'mdi-view-dashboard'" />
            <v-list-item-title> {{ plugin.uiName }}</v-list-item-title>
          </v-list-item>
        </v-list-group>
        <v-divider></v-divider>
        <v-list-item @click="openSoundsFolder">
          <v-list-item-icon icon="mdi-folder-music" />

          <v-list-item-title> Open Sounds Folder </v-list-item-title>
        </v-list-item>
        <v-list-item link to="/about">
          <v-list-item-icon icon="mdi-information-outline" />

          <v-list-item-title> About </v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-main style="max-height: 100%" v-if="loaded">
      <router-view></router-view>
    </v-main>
    <v-main style="max-height: 100%" v-else>
      <v-container fluid class="fill-height">
        <v-row align="center" justify="center">
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
//import path from "path";
//import { ipcRenderer, shell } from "electron";

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
      //shell.openPath(path.join(this.paths.userFolder, "sounds"));
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
