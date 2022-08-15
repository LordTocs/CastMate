<template>
  <v-card>
    <v-card-title> Active Profiles </v-card-title>
    <v-card-text>
      <v-alert dense outlined border="left" type="warning" v-if="!hasProfiles">
        <v-row align="center">
          <v-col class="grow">
            You don't have any profiles. Profiles are CastMate's way of
            organizing triggers.
          </v-col>
          <v-col class="shrink">
            <v-btn
              color="warning"
              outlined
              small
              @click="$refs.addProfileModal.open()"
            >
              Create A Profile
            </v-btn>
          </v-col>
        </v-row>
      </v-alert>
      <v-chip
        v-for="profileName in activeProfiles"
        :key="profileName"
        label
        color="primary"
        class="mx-1"
        @click="() => $router.push(`/profiles/${profileName}`)"
      >
        <span class="mx-1">{{ profileName }} </span>
        <!--<v-btn x-small icon link :to="`/profiles/${profileName}`">
          <v-icon> mdi-pencil </v-icon>
        </v-btn>-->
      </v-chip>
    </v-card-text>
    <named-item-modal
      ref="addProfileModal"
      header="Create New Profile"
      label="Profile Name"
      @created="createNewProfile"
    />
  </v-card>
</template>

<script>
import { mapGetters } from "vuex";
import { mapIpcs } from "../../utils/ipcMap";
import NamedItemModal from "../dialogs/NamedItemModal.vue";

export default {
  components: { NamedItemModal },
  computed: {
    ...mapGetters("ipc", ["activeProfiles", "paths"])
  },
  data() {
    return {
      hasProfiles: true,
    };
  },
  async mounted() {
    let profiles = await this.getProfiles();
    this.hasProfiles = profiles.length > 0;
  },
  methods: {
    ...mapIpcs("io", ["getProfiles", "createProfile"]),
    async createNewProfile(name) {
      await this.createProfile(name);
      this.$router.push(`/profiles/${name}`);
    },
  },
};
</script>

<style>
</style>