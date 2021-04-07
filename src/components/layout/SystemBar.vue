<template>
  <v-system-bar window app class="draggable">
    <!--v-icon>mdi-message</v-icon-->
    <span> {{ title }} </span>
    <v-spacer></v-spacer>
    <v-icon @click="minimize" class="non-draggable">mdi-minus</v-icon>
    <v-icon @click="toggleMaximize" class="non-draggable">
      {{
        isMaximized ? "mdi-window-restore" : "mdi-checkbox-blank-outline"
      }}</v-icon
    >
    <v-icon @click="close" class="non-draggable">mdi-close</v-icon>
  </v-system-bar>
</template>

<script>
const { remote } = require("electron");

export default {
  props: {
    title: {},
  },
  data() {
    return {
      isMaximized: this.getCurrentWindow().isMaximized(),
    };
  },
  methods: {
    getCurrentWindow() {
      return remote.getCurrentWindow();
    },
    close() {
      const window = this.getCurrentWindow();
      window.close();
    },
    minimize() {
      const window = this.getCurrentWindow();
      if (window.minimizable) {
        window.minimize();
      }
    },
    toggleMaximize() {
      const window = this.getCurrentWindow();
      if (window.isMaximized()) {
        this.restore();
        this.isMaximized = window.isMaximized();
      } else {
        this.maximize();
        this.isMaximized = window.isMaximized();
      }
    },
    restore() {
      const window = this.getCurrentWindow();
      window.unmaximize();
    },
    maximize() {
      const window = this.getCurrentWindow();
      if (window.maximizable) {
        window.maximize();
      }
    },
  },
};
</script>

<style scoped>
.draggable {
  -webkit-app-region: drag;
}
.non-draggable {
  -webkit-app-region: no-drag;
}
</style>