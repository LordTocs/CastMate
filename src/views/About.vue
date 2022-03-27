<template>
  <v-container fluid>
    <v-card>
      <v-card-title> CastMate</v-card-title>
      <v-card-subtitle> v{{ version }} </v-card-subtitle>
      <v-card-text>
        <a href="https://www.castmate.io/" target="_blank"> CastMate Home Page </a> <br>
        <a href="https://www.github.com/LordTocs/CastMate" target="_blank"> GitHub </a> <br>
        <!--a href="Put License Here" target="_blank"> License </a><br-->
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color="primary" @click="checkForUpdates">
          Check For Updates
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<script>
import { app } from "@electron/remote";
import { ipcRenderer } from "electron";
export default {
  data() {
    return {
      version: null,
    };
  },
  methods: {
    checkForUpdates() {
      ipcRenderer.invoke("updater.checkForUpdates");
    },
  },
  mounted() {
    this.version = app.getVersion();
  },
};
</script>

<style>
</style>