<template>
  <v-container fluid>
    <file-table :files="profiles" name="Profile" @nav="onNav"/>
  </v-container>
</template>

<script>
import { mapIpcs } from "../utils/ipcMap";
import FileTable from "../components/table/FileTable.vue";

export default {
  components: {
    FileTable
  },
  data() {
    return {
      profiles: [],
      search: "",
    };
  },
  methods: {
    ...mapIpcs("io", ["getProfiles"]),
    async getFiles() {
      this.profiles = await this.getProfiles();
      console.log(this.profiles);
    },
    onNav(name) {
      console.log("Naving", name);
      this.$router.push(`/profiles/${name}`)
    }
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