<template>
  <v-combobox
    v-if="isAutocomplete"
    v-model.lazy="modelObj"
    :items="enumItems"
    :loading="loading"
    :label="label"
    :search-input.sync="search"
    :clearable="clearable"
    @focus="fetchItems"
  />
  <v-select
    v-else
    :items="this.enum"
    :label="label"
    :loading="loading"
    dense
    v-model.lazy="modelObj"
  />
</template>

<script>
import { ipcRenderer } from "electron";
import { mapModel } from "../../../utils/modelValue";
import _cloneDeep from "lodash/cloneDeep"
export default {
  props: {
    modelValue: {},
    enum: {},
    queryMode: { type: Boolean, default: () => false },
    label: { type: String },
    clearable: { type: Boolean, default: () => false },
    context: {},
  },
  computed: {
    isAutocomplete() {
      return typeof this.enum == "string" || this.enum instanceof String;
    },
    ...mapModel()
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
    async fetchItems() {
      if (this.isAutocomplete && !this.queryMode) {
        this.loading = true;

        try
        {
          const items = await ipcRenderer.invoke(this.enum, _cloneDeep(this.context));

          this.allItems = items;
          this.enumItems = items;
          this.loading = false;
        }
        catch(err)
        {
          console.error("Error getting enum items from main process", err);
        }
      }
    },
  },
  watch: {
    async search(newValue) {
      if (this.loading) return;

      this.loading = true;
      if (this.isAutocomplete) {
        this.enumItems = this.filterArray(newValue, this.allItems);
      } else {
        const items = await ipcRenderer.invoke(
          this.enum,
          newValue,
          this.context
        );
        this.enumItems = items;
      }
      this.loading = false;
    },
  },
  async mounted() {
    await this.fetchItems();
  },
};
</script>

<style>
</style>