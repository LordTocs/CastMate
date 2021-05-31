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

    <!--new-profile-modal ref="profileModal" @created="getFiles()" /-->
    <named-item-modal
      ref="profileModal"
      header="Create New Profile"
      label="Profile Name"
      @created="createNewProfile"
    />
    <named-item-modal
      ref="triggerModal"
      header="Create New Commands File"
      label="Commands File Name"
      @created="createNewTriggersFile"
    />
    <named-item-modal
      ref="sequenceModal"
      header="Create New Sequence"
      label="Sequence Name"
      @created="createNewSequence"
    />

    <v-speed-dial v-model="fabOpen" fixed fab large right bottom>
      <template v-slot:activator>
        <v-btn v-model="fab" color="blue darken-2" dark fab>
          <v-icon v-if="fabOpen"> mdi-close </v-icon>
          <v-icon v-else> mdi-plus </v-icon>
        </v-btn>
      </template>
      <v-btn fab dark small color="green" @click="$refs.sequenceModal.open()">
        <v-icon>mdi-plus</v-icon>
        <div class="fab-label green">Sequence</div>
      </v-btn>
      <v-btn fab dark small color="indigo" @click="$refs.triggerModal.open()">
        <v-icon>mdi-plus</v-icon>
        <div class="fab-label indigo">Trigger</div>
      </v-btn>
      <v-btn fab dark small color="red" @click="$refs.profileModal.open()">
        <v-icon>mdi-plus</v-icon>
        <div class="fab-label red">Profile</div>
      </v-btn>
    </v-speed-dial>

    <!--v-fab-transition>
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
    </v-fab-transition-->
  </v-container>
</template>

<script>
import fs from "fs";
import path from "path";
import YAML from "yaml";
import { mapGetters } from "vuex";
import NamedItemModal from "../components/dialogs/NamedItemModal.vue";
export default {
  components: {
    NamedItemModal,
  },
  computed: {
    ...mapGetters("ipc", ["paths"]),
  },
  data() {
    return {
      profiles: [],
      triggers: [],
      sequences: [],
      fabOpen: false,
    };
  },
  methods: {
    async getFiles() {
      let profiles = await fs.promises.readdir(
        path.join(this.paths.userFolder, "profiles")
      );
      let triggers = await fs.promises.readdir(
        path.join(this.paths.userFolder, "triggers")
      );
      let sequences = await fs.promises.readdir(
        path.join(this.paths.userFolder, "sequences")
      );

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
    async createNewProfile(name) {
      let newYaml = YAML.stringify({
        triggers: {},
        variables: {},
        rewards: [],
      });

      await fs.promises.writeFile(
        path.join(this.paths.userFolder, `profiles/${name}.yaml`),
        newYaml,
        "utf-8"
      );

      await this.getFiles();
    },

    async createNewSequence(name) {
      let newYaml = YAML.stringify([]);

      await fs.promises.writeFile(
        path.join(this.paths.userFolder, `sequences/${name}.yaml`),
        newYaml,
        "utf-8"
      );

      await this.getFiles();
    },

    async createNewTriggersFile(name) {
      let newYaml = YAML.stringify({});

      await fs.promises.writeFile(
        path.join(this.paths.userFolder, `triggers/${name}.yaml`),
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

.fab-label {
  position: absolute;
  right: 50px;
  background-color: rgba(0, 0, 0, 0.5);
  padding: 10px;
  box-shadow: 0px 3px 5px -1px rgba(0, 0, 0, 0.2),
    0px 6px 10px 0px rgba(0, 0, 0, 0.14), 0px 1px 18px 0px rgba(0, 0, 0, 0.12);
  border-radius: 2px;
}
</style>