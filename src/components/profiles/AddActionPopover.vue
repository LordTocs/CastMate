<template>
  <v-menu
    v-model="menu"
    :close-on-content-click="false"
    :nudge-width="200"
    offset-x
  >
    <template v-slot:activator="{ on, attrs }">
      <v-btn v-bind="attrs" v-on="on"> Add Action </v-btn>
    </template>

    <v-card>
      <v-card-title> Add New Action </v-card-title>
      <v-divider />
      <v-card-text>
        <v-select
          :items="actionItems"
          item-text="name"
          item-value="key"
          @change="
            (v) => {
              $emit('select', v);
              menu = false;
            }
          "
        />
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<script>
import { mapGetters } from "vuex";
export default {
  computed: {
    ...mapGetters("ipc", ["actions"]),
    actionItems() {
      return Object.keys(this.actions).map((k) => ({
        name: this.actions[k].name,
        key: k,
      }));
    },
  },
  data() {
    return {
      menu: false,
    };
  },
};
</script>

<style>
</style>