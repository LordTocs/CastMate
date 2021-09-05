<template>
  <v-autocomplete
    :value="value"
    @change="(v) => $emit('change', v)"
    :loading="isLoading"
    :search-input.sync="search"
    :items="categories"
    item-value="id"
    item-text="name"
    prepend-icon="mdi-search"
    label="Category"
  >
    <template v-slot:item="data">
      <v-list-item-avatar>
        <img :src="data.item.boxArtUrl" />
      </v-list-item-avatar>
      <v-list-item-content>
        <v-list-item-title> {{ data.item.name }} </v-list-item-title>
      </v-list-item-content>
    </template>
  </v-autocomplete>
</template>

<script>
import { mapIpcs } from "../../utils/ipcMap";

export default {
  props: {
    value: {},
  },
  methods: {
    ...mapIpcs("twitch", ["searchCategories", "getCategoryById"]),
  },
  data() {
    return {
      isLoading: false,
      search: null,
      categories: [],
    };
  },
  async mounted() {
    if (this.value) {
      const cat = await this.getCategoryById(this.value);
      if (cat) {
        this.categories = [cat];
      }
    }
  },
  watch: {
    async search(newSearch) {
      if (this.isLoading) return;
      this.isLoading = true;

      const categories = await this.searchCategories(newSearch);
      this.categories = categories;
      this.isLoading = false;
    },
  },
};
</script>

<style>
</style>