<template>
  <v-autocomplete
    :value="value"
    @input="(v) => $emit('input', v)"
    @change="(v) => $emit('change', v)"
    :items="files"
    :loading="loading"
    :search-input.sync="search"
    cache-items
    :label="label"
    item-text="basename"
    item-value="path"
  >
  </v-autocomplete>
</template>

<script>
import fs from "fs";
import path from "path";
import { mapGetters } from "vuex";

export default {
  props: {
    path: { type: String },
    label: { type: String, default: () => undefined },
    ext: { type: Array },
    //recursive: { type: Boolean, default: () => false },
    value: {},
  },
  computed: {
    ...mapGetters("ipc", ["paths"]),
    searchPath() {
      return path.join(this.paths.userFolder, this.path);
    },
  },
  data() {
    return {
      search: null,
      files: [],
      loading: false,
    };
  },
  watch: {
    search(newValue) {
      if (newValue && newValue != this.value) {
        this.filterFiles(newValue);
      }
    },
  },
  methods: {
    async getFilenames() {
      console.log("Searching: ", this.searchPath);
      const allFiles = await fs.readdirSync(this.searchPath);

      console.log(
        "ExtName",
        allFiles.map((f) => path.extname(f))
      );

      //Filter out extensions
      const files = allFiles.filter((filename) =>
        this.ext.includes(path.extname(filename))
      );

      const fullFiles = files.map((f) => path.join(this.searchPath, f));

      const fileObjs = fullFiles.map((filename) => ({
        path: path.relative(this.paths.userFolder, filename),
        basename: path.basename(filename),
      }));

      console.log(("Found Files: ", JSON.stringify(fileObjs, null, 2)));

      return fileObjs;
    },
    async filterFiles(name) {
      this.loading = true;

      const allFiles = await this.getFilenames();

      //Filter on name
      this.files = allFiles.filter((fileObj) =>
        fileObj.basename.toLowerCase().includes(name.toLowerCase())
      );

      this.loading = false;
    },
  },
  async mounted() {
    this.loading = true;

    this.files = await this.getFilenames();

    this.loading = false;
  },
};
</script>

<style>
</style>