<template>
  <v-card color="grey darken-2">
    <v-card-title>
      {{ triggerName }}
      <v-spacer />
      <v-text-field
        v-model="search"
        append-icon="mdi-magnify"
        label="Filter"
        single-line
        hide-details
      />
    </v-card-title>
    <v-card-text>
      {{ trigger.description }}
    </v-card-text>
    <v-data-table
      color="grey darken-2"
      :headers="headers"
      :items="commandList"
      :search="search"
    >
      <template v-slot:item.actions="{ item }">
        <v-btn fab small class="mx-1" as="router-link" :to="`/profiles/${profileName}/${triggerKey}/${item.key}`">
          <v-icon small> mdi-pencil </v-icon>
        </v-btn>
        <v-btn fab small class="mx-1" @click="tryDelete(item.key)">
          <v-icon small> mdi-delete </v-icon>
        </v-btn>
      </template>

      <template v-slot:footer.prepend>
        <v-btn @click="$refs.addCommandModal.open()"> Add Command </v-btn>
      </template>
    </v-data-table>
    <named-item-modal
      ref="addCommandModal"
      header="Create New Command"
      label="Command"
      @created="createNewCommand"
    />
    <confirm-dialog ref="deleteDlg" />
  </v-card>
</template>

<script>
import { mapGetters, mapMutations } from "vuex";
import NamedItemModal from "../dialogs/NamedItemModal.vue";
import ConfirmDialog from "../dialogs/ConfirmDialog.vue";

export default {
  components: { NamedItemModal,ConfirmDialog },
  props: {
    trigger: {},
    triggerKey: { type: String },
  },
  data() {
    return {
      search: "",
    };
  },
  computed: {
    ...mapGetters("profile", ["profile", "profileName"]),
    commandList() {
      const triggerObj = this.profile.triggers[this.triggerKey] || {};
      return Object.keys(triggerObj)
        .filter((key) => key != "imports")
        .map((key) => ({
          ...triggerObj[key],
          key,
        }));
    },
    triggerName() {
      return this.trigger ? this.trigger.name : this.triggerKey;
    },
    headers() {
      return [
        { text: "Command", value: "key" },
        { text: "Actions", value: "actions", sortable: false, align: "right" },
      ];
    },
  },
  methods: {
    ...mapMutations("profile", ["changeCommand", "deleteCommand"]),
    createNewCommand(name) {
      const command = {
        sync: false,
        actions: [],
      };

      this.changeCommand({
        triggerKey: this.triggerKey,
        commandKey: name,
        command,
      });
    },
    async tryDelete(commandKey) {
      if (
        await this.$refs.deleteDlg.open(
          "Confirm",
          "Are you sure you want to delete this command?"
        )
      ) {
        await this.deleteCommand({ triggerKey: this.triggerKey, commandKey });
      }
    },
  },
};
</script>

<style>
tbody tr:nth-of-type(even) {
  background-color: #424242;
}

tbody tr:nth-of-type(odd) {
  background-color: #424242;
}

.v-data-table-header {
  background-color: #424242;
  color: white;
}

.v-data-footer {
  background-color: #424242;
}
</style>