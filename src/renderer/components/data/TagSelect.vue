<template>
  <v-autocomplete
    multiple
    :items="tags"
    item-text="name"
    item-value="id"
    label="Tags"
    :loading="loading"
    :value="value"
    :search-input.sync="search"
    @change="changed"
    prepend-icon="mdi-magnify"
  >
    <template v-slot:selection="data">
      <v-chip
        v-bind="data.attrs"
        :input-value="data.selected"
        close
        @click:close="remove(data.item)"
      >
        {{ data.item.name }}
      </v-chip>
    </template>
  </v-autocomplete>
</template>

<script>
import { mapGetters } from "vuex";
import { mapIpcs } from '../../utils/ipcMap';
export default {
  props: {
    value: {},
  },
  data() {
    return {
      tags: [],
      search: null,
      loading: false,
    };
  },
  computed: {
  },
  methods: {
    ...mapIpcs("twitch", ["getAllTags"]),
    remove(item) {
      const newValue = [...this.value];

      const i = newValue.findIndex((i) => i == item.id);

      if (i == -1) return;

      newValue.splice(i, 1);

      this.$emit("change", newValue);
    },
    changed(newValue) {
      this.$emit("change", newValue);
      this.search = null;
    },
  },
  async mounted() {
    this.loading = true;
    this.tags = await this.getAllTags();
    this.loading = false;
  }
};
</script>

<style>
</style>