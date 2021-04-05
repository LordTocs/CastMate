<template>
  <v-container fluid>
    <v-card id="lateral">
      <confirm-dialog ref="deleteConfirm" />
      <v-simple-table>
        <template v-slot:default>
          <thead>
            <tr>
              <th class="text-left">Name</th>
              <th class="text-left"></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="profile in profiles"
              :key="profile.name"
              @click="$router.push(`/profiles/${profile.name}`)"
            >
              <td>{{ profile.name }}</td>
              <td style="width: 25%">
                <v-btn
                  color="danger"
                  elevation="4"
                  @click.stop="askDelete(profile)"
                >
                  Delete
                </v-btn>
              </td>
            </tr>
          </tbody>
        </template>
      </v-simple-table>
    </v-card>

    <v-fab-transition>
      <v-btn color="primary" fixed fab large right bottom>
        <v-icon> mdi-plus </v-icon>
      </v-btn>
    </v-fab-transition>
  </v-container>
</template>

<script>
import fs from "fs";
import path from "path";
import YAML from "yaml";
export default {
  components: {
    ConfirmDialog: () => import("../components/dialogs/ConfirmDialog.vue"),
  },
  data() {
    return {
      newProfileName: null,
      profilePop: false,
      profiles: [],
    };
  },
  methods: {
    async getFiles() {
      let profiles = await fs.promises.readdir("./user/profiles");

      profiles = profiles.filter((f) => path.extname(f) == ".yaml");

      this.profiles = profiles.map((f) => ({
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
    async deleteProfile(profile) {
      await fs.promises.unlink(`./user/profiles/${profile.name}.yaml`);

      await this.getFiles();
    },
    async askDelete(profile) {
      if (
        await this.$refs.deleteConfirm.open(
          "Confirm",
          "Are you sure you want to delete this profile?"
        )
      ) {
        await this.deleteProfile(profile);
      }
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