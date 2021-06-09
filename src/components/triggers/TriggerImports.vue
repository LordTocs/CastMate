<template>
  <v-card color="grey darken-3" v-if="value">
    <v-card-title> Imports </v-card-title>
    <v-card-text>
      <v-list color="grey darken-3">
        <v-list-item v-for="(imprt, i) in value" :key="i">
          <v-list-item-content>
            <file-autocomplete
              :value="imprt"
              @change="(v) => changeImport(i, v)"
              path="./commands/"
              :ext="['.yaml']"
              label="Commands File"
            />
          </v-list-item-content>
          <v-list-item-action>
            <v-btn color="red" @click="deleteImport(i)"> Delete </v-btn>
          </v-list-item-action>
        </v-list-item>
      </v-list>
    </v-card-text>
  </v-card>
</template>

<script>
import FileAutocomplete from "../data/FileAutocomplete.vue";

export default {
  components: { FileAutocomplete },
  props: {
    value: {},
  },
  methods: {
    deleteImport(index) {
      if (!this.value) return;

      let result = [...this.value];
      result.splice(index, 1);

      this.$emit("input", result);
    },
    changeImport(index, value) {
      if (!this.value) return;
      let result = [...this.value];

      result[index] = value;

      this.$emit("input", result);
    },
  },
};
</script>

<style>
</style>