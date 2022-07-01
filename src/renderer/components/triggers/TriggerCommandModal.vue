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
          <data-input :schema="trigger.config" v-model="config" />
          <automation-input v-model="automation" />
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
            @click.native="() => create()"
          >
            Create
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>

<script>
import AutomationInput from "../automations/AutomationInput.vue";
import AutomationSelector from "../automations/AutomationSelector.vue";
import DataInput from "../data/DataInput.vue";
import EnumInput from "../data/EnumInput.vue";
import NumberInput from "../data/NumberInput.vue";
import { nanoid } from "nanoid/non-secure";
export default {
  components: {
    NumberInput,
    EnumInput,
    AutomationSelector,
    AutomationInput,
    DataInput,
  },
  props: {
    header: { type: String, default: () => "Create" },
    label: { type: String, default: () => "Name" },
    trigger: {},
  },
  data() {
    return {
      config: null,
      automation: null,
      dialog: false,
    };
  },
  methods: {
    open() {
      this.config = null;
      this.automation = null;
      this.dialog = true;
    },
    cancel() {
      this.dialog = false;
    },
    create() {
      //if (this.key === null || this.key === undefined) return;
      //Todo validate config here. Perhaps use @lordtocs/schema

      this.dialog = false;
      this.$emit("created", {
        id: nanoid(),
        config: this.config,
        automation: this.automation,
      });
    },
  },
};
</script>

<style>
</style>