<template>
  <v-container fluid>
    <v-card id="lateral">
      <v-list color="grey darken-3">
        <v-list-item>
          <v-list-item-content>
            <v-list-item-title class="title"> Profiles </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
      <v-list>
        <v-list-item-group>
          <template v-for="(profile, i) in profiles">
            <v-list-item
              :key="profile.name"
              @click="$router.push(`/profiles/${profile.name}`)"
            >
              <v-list-item-content>
                <v-list-item-title> {{ profile.name }} </v-list-item-title>
              </v-list-item-content>
            </v-list-item>
            <v-divider :key="i" />
          </template>
        </v-list-item-group>
      </v-list>
      <v-list color="grey darken-3">
        <v-list-item>
          <v-list-item-content>
            <v-list-item-title class="title"> Triggers </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
      <v-list>
        <v-list-item-group>
          <template v-for="(trigger, i) in triggers">
            <v-list-item
              :key="trigger.name"
              @click="$router.push(`/triggers/${trigger.name}`)"
            >
              <v-list-item-content>
                <v-list-item-title> {{ trigger.name }} </v-list-item-title>
              </v-list-item-content>
            </v-list-item>
            <v-divider :key="i" />
          </template>
        </v-list-item-group>
      </v-list>
      <v-list color="grey darken-3">
        <v-list-item>
          <v-list-item-content>
            <v-list-item-title class="title"> Sequences </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
      <v-list>
        <v-list-item-group>
          <template v-for="(sequence, i) in sequences">
            <v-list-item
              :key="sequence.name"
              @click="$router.push(`/sequences/${sequence.name}`)"
            >
              <v-list-item-content>
                <v-list-item-title> {{ sequence.name }} </v-list-item-title>
              </v-list-item-content>
            </v-list-item>
            <v-divider :key="i" />
          </template>
        </v-list-item-group>
      </v-list>
    </v-card>

    <new-profile-modal ref="profileModal" @created="getFiles()" />

    <v-fab-transition>
      <v-btn
        color="primary"
        fixed
        fab
        large
        right
        bottom
        @click="$refs.profileModal.open()"
      >
        <v-icon> mdi-plus </v-icon>
      </v-btn>
    </v-fab-transition>
  </v-container>
</template>

<script>
import fs from "fs";
import path from "path";
import YAML from "yaml";
import NewProfileModal from "../components/profiles/NewProfileModal.vue";
export default {
  components: {
    NewProfileModal,
  },
  data() {
    return {
      newProfileName: null,
      profilePop: false,
      profiles: [],
      triggers: [],
      sequences: [],
    };
  },
  methods: {
    async getFiles() {
      let profiles = await fs.promises.readdir("./user/profiles");
      let triggers = await fs.promises.readdir("./user/triggers");
      let sequences = await fs.promises.readdir("./user/sequences");

      profiles = profiles.filter((f) => path.extname(f) == ".yaml");
      triggers = triggers.filter((f) => path.extname(f) == ".yaml");
      sequences = sequences.filter((f) => path.extname(f) == ".yaml");

      this.profiles = profiles.map((f) => ({
        name: path.basename(f, ".yaml"),
      }));

      this.triggers = triggers.map((f) => ({
        name: path.basename(f, ".yaml"),
      }));

      this.sequences = sequences.map((f) => ({
        name: path.basename(f, ".yaml"),
      }));
    },
    async createProfile() {
      this.profilePop = false;

      let newYaml = YAML.stringify({
        triggers: {},
        variables: {},
        rewards: [],
      });

      await fs.promises.writeFile(
        `./user/profiles/${this.newProfileName}.yaml`,
        newYaml,
        "utf-8"
      );

      await this.getFiles();
    },
  },
  async mounted() {
    await this.getFiles();
  },
};
</script>

<style>
.el-table__empty-block {
  display: none !important;
}

/* This is for documentation purposes and will not be needed in your application */
#lateral .v-btn--example {
  bottom: 0;
  left: 0;
  position: absolute;
  margin: 0 0 16px 16px;
}
</style>