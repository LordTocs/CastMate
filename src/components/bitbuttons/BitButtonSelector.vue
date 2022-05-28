<template>
  <v-card-actions>
    <v-autocomplete
      :value="value"
      :items="items"
      item-value="_id"
      item-text="name"
      :label="label"
      :search-input.sync="search"
      @input="(v) => $emit('input', v)"
      @change="(v) => $emit('change', v)"
      clearable
    />
    <v-menu bottom right>
      <template v-slot:activator="{ on, attrs }">
        <v-btn dark icon v-bind="attrs" v-on="on">
          <v-icon>mdi-dots-vertical</v-icon>
        </v-btn>
      </template>

      <v-list>
        <v-list-item link :disabled="!value" @click="$refs.editModal.open()">
          <v-list-item-title> Edit Button Hook </v-list-item-title>
        </v-list-item>
        <v-list-item link :disabled="!!value" @click="$refs.createModal.open()">
          <v-list-item-title> Create Button Hook </v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>

    <bit-button-modal
      ref="editModal"
      title="Edit BitButton Hook"
      :hookId="value"
      :showDelete="false"
    />

    <bit-button-modal
      ref="createModal"
      title="Create BitButton Hook"
      :showSave="false"
      :showCreate="true"
      :showDelete="false"
      @created="(v) => $emit('input', v)"
    />
  </v-card-actions>
</template>

<script>
import { mapGetters } from "vuex";
import BitButtonModal from "./BitButtonModal.vue";

export default {
  components: { BitButtonModal },
  props: {
    value: {},
    label: { type: String, default: () => "BitButton" },
  },
  computed: {
    currentHook() {
      return this.buttonHooks.find((b) => b._id == this.value);
    },
    ...mapGetters("bitbuttons", ["buttonHooks"]),
  },
  data() {
    return {
      items: [],
      search: null,
    };
  },
  methods: {
    filterButtons(query) {
      let result = [...this.buttonHooks];

      if (query) {
        result = result.filter((h) => {
          try {
            return h.name.toLowerCase().includes(query.toLowerCase());
          } catch {
            return false;
          }
        });
      }

      this.items = result;
    },
  },
  async mounted() {
    this.filterButtons();
  },
  watch: {
    async search(newSearch) {
      await this.filterButtons(newSearch);
    },
    buttonHooks: {
      deep: true,
      handler() {
        this.filterButtons();
      },
    },
  },
};
</script>

<style>
</style>