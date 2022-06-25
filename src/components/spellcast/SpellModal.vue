<template>
  <v-dialog v-model="dialog" width="50%" @keydown.esc="cancel">
    <v-card>
      <v-toolbar dense flat>
        <v-toolbar-title class="text-body-2 font-weight-bold grey--text">
          {{ title || "Edit Spell Hook" }}
        </v-toolbar-title>
      </v-toolbar>
      <v-card-text>
        <spell-edit v-model="hookEdit" />
      </v-card-text>
      <v-card-actions class="pt-3">
        <v-spacer></v-spacer>
        <v-btn color="grey" text class="body-2 font-weight-bold" @click.native="cancel">
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          class="body-2 font-weight-bold"
          outlined
          v-if="showSave"
          @click.native="save"
        >
          Save
        </v-btn>
        <v-btn
          color="primary"
          class="body-2 font-weight-bold"
          outlined
          v-if="showCreate"
          @click.native="create"
        >
          Create
        </v-btn>
        <v-btn
          color="red"
          class="body-2 font-weight-bold"
          outlined
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
import _ from "lodash";
import SpellEdit from "./SpellEdit.vue";
import { mapActions, mapGetters } from "vuex";
export default {
  components: { SpellEdit },
  props: {
    hookId: {},
    title: {},
    showSave: { type: Boolean, default: () => true },
    showDelete: { type: Boolean, default: () => true },
    showCreate: { type: Boolean, default: () => false },
  },
  data() {
    return {
      hookEdit: {},
      dialog: false,
    };
  },
  computed: {
    ...mapGetters("spellcast", ["spellHooks"]),
  },
  methods: {
    ...mapActions("spellcast", ["createSpellHook", "updateHookHook"]),
    async open() {
      let hook = null;
      if (this.hookId) {
        hook = this.spellHooks.find((h) => h._id == this.hookId);
      }
      this.hookEdit = _.cloneDeep(hook) || {};
      this.dialog = true;
    },
    save() {
      this.updateSpellHook({ hookId: this.hookId, hookData: this.hookEdit });
      this.trackAnalytic("saveSpellHook");
      this.dialog = false;
    },
    deleteMe() {
      this.deleteSpellHook({ hookId: this.hookId });
      this.trackAnalytic("deleteSpellHook");
      this.dialog = false;
    },
    cancel() {
      this.dialog = false;
    },
    async create() {
      const hook = await this.createSpellHook({ hookData: this.hookEdit });
      if (!hook) {
        return;
      }
      this.dialog = false;
      this.$emit("created", hook._id);
      this.trackAnalytic("createSpellHook");
    },
  },
};
</script>

<style></style>
