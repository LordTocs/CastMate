<template>
  <v-text-field
    :value="value"
    @input="(v) => $emit('input', v)"
    v-if="!schema.enum"
    :label="schema.name || label"
  />
  <v-autocomplete
    :value="value"
    v-else-if="schema.enum || schema.enumQuery"
    :items="enumItems"
    :loading="loading"
    cache-items
    :label="dataName"
    :search-input.sync="search"
    @input="(v) => $emit('input', v)"
    @change="(v) => $emit('change', v)"
  />
</template>

<script>
import { ipcRenderer } from "electron";
export default {
  props: {
    value: {},
    schema: {},
    dataName: { type: String },
  },
  data() {
    return {
      search: "",
      allItems: [],
      enumItems: [],
      loading: false,
    };
  },
  methods: {
    filterArray(search, arr) {
      return search
        ? arr.filter((i) => i.toLowerCase().includes(search.toLowerCase()))
        : arr;
    },
  },
  watch: {
    async search(newValue) {
      if (this.loading) return;

      this.loading = true;
      if (typeof this.schema.enum === "string") {
        this.enumItems = this.filterArray(newValue, this.allItems);
      } else if (typeof this.schema.enumQuery == "string") {
        const items = await ipcRenderer.invoke(this.schema.enumQuery, newValue);
        this.enumItems = items;
      } else if (this.schema.enum instanceof Array) {
        this.enumItems = this.filterArray(this.schema.enum);
      }
      this.loading = false;
    },
  },
  async mounted() {
    if (typeof this.schema.enum === "string") {
      this.loading = true;

      const items = await ipcRenderer.invoke(this.schema.enum);
      this.allItems = items;
      this.enumItems = items;

      this.loading = false;
    }
  },
};
</script>

<style>
</style>