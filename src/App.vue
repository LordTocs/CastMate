<template>
  <div id="app">
    <el-container>
      <el-aside>
        <el-menu :router="true">
          <el-menu-item index="/">
            <i class="el-icon-document"></i>
            <span>Profiles</span>
          </el-menu-item>

          <el-menu-item index="/rewards">
            <i class="el-icon-star-on"></i>
            <span>Channel Point Rewards</span>
          </el-menu-item>

          <el-submenu index="1">
            <template slot="title">
              <i class="el-icon-cpu"></i>
              <span>Plugins</span>
            </template>
            <el-menu-item
              :index="`/plugins/${plugin.name}`"
              v-for="plugin in uiPlugins"
              :key="plugin.name"
            >
              <!--i class="el-icon-document"></i-->
              <span> {{ plugin.uiName }}</span>
            </el-menu-item>
          </el-submenu>
        </el-menu>
      </el-aside>
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </div>
</template>

<script>
import { mapGetters, mapActions } from "vuex";

export default {
  data() {
    return {};
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
  },
  async mounted() {
    await this.init();
  },
};
</script>

<style>
body {
  margin: 0;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

#nav {
  padding: 30px;
}

#nav a {
  font-weight: bold;
  color: #2c3e50;
}

#nav a.router-link-exact-active {
  color: #42b983;
}
</style>
