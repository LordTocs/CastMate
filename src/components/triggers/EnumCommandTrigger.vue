<template>
  <v-card color="grey darken-2">
    <v-card-title>
      {{ triggerName }}
      <v-spacer />
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
      <template v-slot:item.key="props">
        <v-edit-dialog
          @open="openRename(props.item.key)"
          @save="renameCommand(props.item.key, rename.toLowerCase())"
        >
          {{ props.item.key }}
          <template v-slot:input>
            <enum-input
              v-model="rename"
              label="Command"
              :enum="trigger.enum"
            />
          </template>
        </v-edit-dialog>
      </template>

      <template v-slot:item.automation="props">
        <automation-selector
          :value="props.item.automation"
          @change="(v) => changeAutomation(props.item.key, v)"
        />
      </template>

      <template v-slot:item.actions="{ item }">
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
import AutomationSelector from "../automations/AutomationSelector.vue";
import ConfirmDialog from "../dialogs/ConfirmDialog.vue";
import { changeObjectKey } from "../../utils/objects";
import EnumInput from "../data/EnumInput.vue";

export default {
  components: { NamedItemModal, ConfirmDialog, AutomationSelector, EnumInput },
  props: {
    trigger: {},
    triggerKey: { type: String },
    value: {},
  },
  data() {
    return {
      rename: null,
      search: "",
    };
  },
  computed: {
    commandList() {
      const triggerObj = this.value;
      if (!triggerObj) return [];
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
        { text: "Automation", value: "automation" },
        { text: "Actions", value: "actions", sortable: false, align: "right" },
      ];
    },
  },
  methods: {
    openRename(commandKey) {
      this.rename = commandKey;
    },
    createNewCommand(commandkey) {
      if (this.value && commandkey in this.value) return;

      const result = { ...this.value };
      result[commandkey] = { automation: null };

      this.$emit("input", result);
    },
    changeAutomation(commandKey, automationName) {
      const result = { ...this.value };
      result[commandKey] = { automation: automationName };
      this.$emit("input", result);
    },
    async tryDelete(commandKey) {
      if (
        await this.$refs.deleteDlg.open(
          "Confirm",
          "Are you sure you want to delete this command?"
        )
      ) {
        //Delete the command
        const result = { ...this.value };
        delete result[commandKey];
        this.$emit("input", result);
      }
    },
    renameCommand(oldKey, newKey) {
      console.log("renameCommand", oldKey, newKey);
      const result = changeObjectKey(this.value, oldKey, newKey);
      this.$emit("input", result);
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