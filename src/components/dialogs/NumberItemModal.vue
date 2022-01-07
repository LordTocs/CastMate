<template>
  <v-dialog v-model="dialog" width="50%" @keydown.esc="cancel">
    <v-card>
      <v-toolbar dense flat>
        <v-toolbar-title class="text-body-2 font-weight-bold grey--text">
          {{ header }}
        </v-toolbar-title>
      </v-toolbar>
      <v-form @submit.prevent="create">
        <v-card-text>
          <number-input v-model="number" :label="label" />
        </v-card-text>
        <v-card-actions class="pt-3">
          <v-spacer></v-spacer>
          <v-btn
            color="grey"
            text
            class="body-2 font-weight-bold"
            @click.native="cancel"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            class="body-2 font-weight-bold"
            outlined
            @click.native="create"
          >
            Create
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>

<script>
import NumberInput from '../data/NumberInput.vue';
export default {
  components: { NumberInput },
  props: {
    header: { type: String, default: () => "Create" },
    label: { type: String, default: () => "Name" },
  },
  data() {
    return {
      number: null,
      dialog: false,
    };
  },
  methods: {
    open() {
      this.number = null;
      this.dialog = true;
    },
    cancel() {
      this.dialog = false;
    },
    async create() {
      if (this.number === null || this.number === undefined) return;

      this.dialog = false;
      this.$emit("created", this.number);
    },
  },
};
</script>

<style>
</style>