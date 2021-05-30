<template>
  <v-dialog v-model="dialog" width="50%" @keydown.esc="cancel">
    <v-card>
      <v-toolbar dense flat>
        <v-toolbar-title class="text-body-2 font-weight-bold grey--text">
          Create New Profile
        </v-toolbar-title>
      </v-toolbar>
      <v-card-text>
        <v-text-field v-model="profileName" label="Profile Name" />
      </v-card-text>
      <v-card-actions class="pt-3">
        <v-spacer></v-spacer>
        <v-btn
          color="grey"
          text
          class="body-2 font-weight-bold"
          @click.native="cancel"
        >
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          class="body-2 font-weight-bold"
          outlined
          @click.native="create"
        >
          Create
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import YAML from "yaml";
import fs from "fs";
import path from "path";
import { mapGetters } from "vuex";

export default {
  props: {},
  data() {
    return {
      profileName: null,
      dialog: false,
    };
  },
  computed: {
    ...mapGetters("ipc", ["paths"]),
  },
  methods: {
    open() {
      this.profileName = null;
      this.dialog = true;
    },
    cancel() {
      this.dialog = false;
    },
    async create() {
      if (!this.profileName) return;

      this.profilePop = false;

      let newYaml = YAML.stringify({
        triggers: {},
        variables: {},
        rewards: [],
      });

      await fs.promises.writeFile(
        path.join(this.paths.userFolder, `profiles/${this.profileName}.yaml`),
        newYaml,
        "utf-8"
      );

      this.dialog = false;
      this.$emit("created", this.profileName);
    },
  },
};
</script>

<style>
</style>