<template>
  <v-system-bar window app class="draggable">
    <img src="../../assets/logo-dark.svg" style="height: 1em; margin-right: 0.5em" />
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
import { getCurrentWindow } from "@electron/remote";

export default {
  props: {
    title: {},
  },
  data() {
    return {
      isMaximized: getCurrentWindow().isMaximized(),
    };
  },
  methods: {
    close() {
      const window = getCurrentWindow();
      window.close();
    },
    minimize() {
      const window = getCurrentWindow();
      if (window.minimizable) {
        window.minimize();
      }
    },
    toggleMaximize() {
      const window = getCurrentWindow();
      if (window.isMaximized()) {
        this.restore();
        this.isMaximized = window.isMaximized();
      } else {
        this.maximize();
        this.isMaximized = window.isMaximized();
      }
    },
    restore() {
      const window = getCurrentWindow();
      window.unmaximize();
    },
    maximize() {
      const window = getCurrentWindow();
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