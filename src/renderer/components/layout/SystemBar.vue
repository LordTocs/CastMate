<template>
  <v-system-bar window app class="draggable" color="black">
    <img src="../../assets/logo-dark.svg" style="height: 1em; margin-right: 0.5em" />
    <span> {{ title }} </span>
    <v-spacer></v-spacer>
    <v-icon @click="minimize" class="non-draggable">mdi-minus</v-icon>
    <v-icon @click="toggleMaximize" class="non-draggable">
      {{
          maximized ? "mdi-window-restore" : "mdi-checkbox-blank-outline"
      }}
    </v-icon>
    <v-icon @click="close" class="non-draggable">mdi-close</v-icon>
  </v-system-bar>
</template>

<script>
import { mapIpcs } from "../../utils/ipcMap";

export default {
  props: {
    title: {},
  },
  data() {
    return {
      maximized: this.isMaximized(),
    };
  },
  methods: {
    ...mapIpcs("windowFuncs", ["minimize", "maximize", "isMaximized", "restore", "close"]),

    toggleMaximize() {
      if (this.isMaximized()) {
        this.restore();
        this.maximized = isMaximized();
      } else {
        this.maximize();
        this.maximized = isMaximized();
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