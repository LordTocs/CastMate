<template>
  <v-dialog v-model="dialog"  @keydown.esc="cancel">
    <v-card width="50vw">
      <v-toolbar dense flat>
        <v-toolbar-title class="text-body-2 font-weight-bold grey--text">
          {{ title || "Edit Spell Hook" }}
        </v-toolbar-title>
      </v-toolbar>
      <v-card-text>
        <spellcast-hook-edit v-model="hookEdit" />
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
          v-if="showSave"
          @click.native="save"
          :active="valid"
        >
          Save
        </v-btn>
        <v-btn
          color="primary"
          class="body-2 font-weight-bold"
          v-if="showCreate"
          @click.native="create"
          :active="valid"
        >
          Create
        </v-btn>
        <v-btn
          color="red"
          class="body-2 font-weight-bold"
          v-if="showDelete"
          @click.native="deleteMe"
        >
          Delete
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import _cloneDeep from "lodash/cloneDeep"
import { mapIpcs } from "../../utils/ipcMap";
import SpellcastHookEdit from "./SpellcastHookEdit.vue";

export default {
  components: { SpellcastHookEdit },
  props: {
    hook: {},
    title: {},
    showSave: { type: Boolean, default: () => true },
    showDelete: { type: Boolean, default: () => true },
    showCreate: { type: Boolean, default: () => false },
  },
  emits: ["updated", "deleted", "created"],
  data() {
    return {
      hookEdit: {},
      dialog: false,
      valid: false,
    };
  },
  methods: {
    ...mapIpcs("spellcast", ["createSpellHook", "deleteSpellHook", "updateSpellHook"]),
    open() {
      this.hookEdit = _cloneDeep(this.hook) || {};
      this.dialog = true;
    },
    async save() {
      await this.updateSpellHook(this.hook._id, { name: this.hookEdit.name, description: this.hookEdit.description});
      this.$emit('updated', this.hookEdit);
      this.dialog = false;
    },
    async deleteMe() {
      await this.deleteSpellHook(this.hook._id);
      this.$emit('deleted');
      this.dialog = false;
    },
    cancel() {
      this.dialog = false;
    },
    async create() {
      const hook = await this.createSpellHook(this.hookEdit);
      this.$emit("created", hook._id);
      this.dialog = false;
    },
  },
};
</script>

<style>
</style>