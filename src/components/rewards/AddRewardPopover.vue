<template>
  <v-menu
    v-model="menu"
    :close-on-content-click="false"
    :nudge-width="200"
    offset-x
  >
    <template v-slot:activator="{ on, attrs }">
      <v-btn v-bind="attrs" v-on="on"> Add Reward </v-btn>
    </template>

    <v-card>
      <v-card-title> Add Reward To Profile </v-card-title>
      <v-divider />
      <v-card-text>
        <v-select
          :value="null"
          label="Channel Point Reward"
          @change="
            (v) => {
              $emit('input', v);
              menu = false;
            }
          "
          :items="remainingRewards"
          item-value="name"
          item-text="name"
        />
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<script>
import { mapGetters } from "vuex";
export default {
  props: {
    existingRewards: {},
  },
  computed: {
    ...mapGetters("rewards", ["rewards"]),
    remainingRewards() {
      let filterRewards = this.existingRewards || [];
      return this.rewards.filter((k) => !filterRewards.includes(k.name));
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