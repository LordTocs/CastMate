<template>
  <v-app>
    <system-bar title="CastMate" />

    <v-app-bar dense app>
      <v-app-bar-nav-icon @click="navDrawer = !navDrawer"></v-app-bar-nav-icon>

      <v-toolbar-title> {{ $route.name }}</v-toolbar-title>

      <v-spacer></v-spacer>
    </v-app-bar>

    <v-navigation-drawer app v-model="navDrawer">
      <v-list-item>
        <v-list-item-content>
          <v-list-item-title class="title"> CastMate </v-list-item-title>
          <!--v-list-item-subtitle> subtext </v-list-item-subtitle-->
        </v-list-item-content>
      </v-list-item>

      <v-divider></v-divider>

      <v-list dense nav>
        <v-list-item link to="/">
          <v-list-item-icon>
            <v-icon>mdi-file-document-outline</v-icon>
          </v-list-item-icon>

          <v-list-item-content>
            <v-list-item-title> Profiles </v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-list-item link to="/rewards">
          <v-list-item-icon>
            <v-icon>mdi-star-circle-outline</v-icon>
          </v-list-item-icon>

          <v-list-item-content>
            <v-list-item-title> Rewards </v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-list-group n-action>
          <template v-slot:activator>
            <v-list-item-title>Plugins</v-list-item-title>
          </template>

          <v-list-item
            v-for="plugin in uiPlugins"
            :to="`/plugins/${plugin.name}`"
            :key="plugin.name"
          >
            <v-list-item-icon>
              <v-icon> mdi-view-dashboard </v-icon>
            </v-list-item-icon>
            <v-list-item-title> {{ plugin.uiName }}</v-list-item-title>
          </v-list-item>
        </v-list-group>
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <!-- Provides the application the proper gutter -->
      <router-view></router-view>
    </v-main>

    <v-footer app>
      <!-- -->
    </v-footer>
  </v-app>
</template>

<script>
import { mapGetters, mapActions } from "vuex";
import SystemBar from "./components/layout/SystemBar.vue";

export default {
  components: {
    SystemBar,
  },
  data() {
    return {
      navDrawer: null,
    };
  },
  computed: {
    ...mapGetters("ipc", ["inited", "plugins"]),
    uiPlugins() {
      return this.plugins
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
  },
  async mounted() {
    await this.init();
    await this.loadRewards();
  },
};
</script>

<style>
</style>
