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
          <slot name="new-selector" :value="key" :valueInput="(v) => key = v" :label="label">
            <number-input v-model="key" :label="label" />
          </slot>
          <automation-selector v-model="automation" />
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
import AutomationSelector from '../automations/AutomationSelector.vue';
import EnumInput from '../data/EnumInput.vue';
import NumberInput from '../data/NumberInput.vue';
export default {
  components: { NumberInput, EnumInput, AutomationSelector },
  props: {
    header: { type: String, default: () => "Create" },
    label: { type: String, default: () => "Name" },
    trigger: {},
  },
  data() {
    return {
      key: null,
      automation: null,
      dialog: false,
    };
  },
  methods: {
    open() {
      this.key = null;
      this.automation = null;
      this.dialog = true;
    },
    cancel() {
      this.dialog = false;
    },
    async create() {
      if (this.key === null || this.key === undefined) return;

      this.dialog = false;
      this.$emit("created", { key: this.key, automation: this.automation });
    },
  },
};
</script>

<style>
</style>