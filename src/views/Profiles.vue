<template>
  <div>
    <el-table :data="profiles" style="width: 100%; margin-bottom: 18px">
      <el-table-column prop="name" label="Name"> </el-table-column>
      <el-table-column label="Operations" align="right">
        <template slot-scope="scope">
          <el-button
            size="mini"
            @click="$router.push(`/profiles/${scope.row.name}`)"
          >
            Edit
          </el-button>
          <el-popconfirm
            confirm-button-text="OK"
            cancel-button-text="No, Thanks"
            icon="el-icon-info"
            icon-color="red"
            title="Are you sure to delete this?"
            @confirm="deleteProfile(scope.row)"
          >
            <el-button slot="reference" size="mini">Delete</el-button>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <level>
      <div class="right">
        <el-popover v-model="profilePop" placement="top">
          <el-form>
            <el-form-item label="Profile Name">
              <el-input v-model="newProfileName" placeholder="Profile Name" />
              <!-- todo validate filename -->
              <el-button @click="createProfile()"> Create Profile </el-button>
            </el-form-item>
          </el-form>
          <el-button slot="reference"> Add Profile </el-button>
        </el-popover>
      </div>
    </level>
  </div>
</template>

<script>
import fs from "fs";
import path from "path";
import YAML from "yaml";
import Level from "../components/layout/Level";
export default {
  components: {
    Level,
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
</style>