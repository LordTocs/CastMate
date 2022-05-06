<template>
  <v-card>
    <v-card-title> Active Profiles </v-card-title>
    <v-card-text>
      <div>
        You don't have any profiles. Profiles are CastMate's way of organizing
        triggers.
        <v-btn> Create A Profile </v-btn>
      </div>
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
import { getAllProfiles } from '../../utils/fileTools';
import { mapGetters } from "vuex";

export default {
  computed: {
    ...mapGetters("ipc", ["activeProfiles", "paths"]),
  },
  data() {
    return {
      hasProfiles: true,
    };
  },
  async mounted() {
    let profiles = await getAllProfiles();
    this.hasProfiles = profiles.length > 0;
  },
};
</script>

<style>
</style>