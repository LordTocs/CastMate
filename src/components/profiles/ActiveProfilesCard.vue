<template>
  <v-card>
    <v-card-title> Active Profiles </v-card-title>
    <v-card-text>
      <v-chip
        v-for="profileName in activeProfiles"
        :key="profileName"
        label
        color="primary"
        class="mx-1"
      >
        <span class="mx-1">{{ profileName }} </span>
        <v-btn x-small icon link :to="`/profiles/${profileName}`">
          <v-icon> mdi-pencil </v-icon>
        </v-btn>
      </v-chip>
    </v-card-text>
  </v-card>
</template>

<script>
import { mapGetters } from "vuex";

export default {
  computed: {
    ...mapGetters("ipc", ["activeProfiles"]),
  },
};
</script>

<style>
</style>