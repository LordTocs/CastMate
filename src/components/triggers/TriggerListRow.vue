<template>
  <tr class="no-hover">
    <td :style="{ backgroundColor: plugins[pluginKey].color }">
      {{ plugins[pluginKey].triggers[triggerKey].name || triggerKey }}
    </td>
    <td>
      <data-view
        :schema="plugins[pluginKey].triggers[triggerKey].config"
        :value="mapping.config"
      />
    </td>
    <td>
      <v-chip
        class="ma-2"
        outlined
        v-if="
          typeof mapping.automation == 'string' ||
          mapping.automation instanceof String
        "
      >
        <v-icon left> mdi-flash </v-icon>
        {{ mapping.automation }}
      </v-chip>
    </td>
    <td>
      <automation-preview :automation="mapping.automation" />
    </td>
    <td class="text-right">
      <trigger-edit-modal
        header="Edit Trigger"
        ref="editModal"
        :mapping="mapping"
        :triggerType="{ triggerKey, pluginKey }"
        @mapping="(tt, mapping) => $emit('mapping', tt, mapping)"
      />
      <v-btn dark icon @click="$refs.editModal.open()">
        <v-icon>mdi-pencil</v-icon>
      </v-btn>
      <v-menu bottom right>
        <template v-slot:activator="{ on, attrs }">
          <v-btn dark icon v-bind="attrs" v-on="on">
            <v-icon>mdi-dots-vertical</v-icon>
          </v-btn>
        </template>

        <v-list>
          <v-list-item link>
            <v-list-item-title @click="$refs.editModal.open()">
              Edit
            </v-list-item-title>
          </v-list-item>
          <v-list-item link @click="tryDelete()">
            <v-list-item-title> Delete </v-list-item-title>
          </v-list-item>
          <!--v-list-item>
            <v-list-item-title> Duplicate </v-list-item-title>
          </v-list-item-->
        </v-list>
      </v-menu>
    </td>
    <confirm-dialog ref="deleteDlg" />
  </tr>
</template>

<script>
import { mapGetters } from "vuex";
import AutomationPreview from "../automations/AutomationPreview.vue";
import DataView from "../data/DataView.vue";
import ConfirmDialog from "../dialogs/ConfirmDialog.vue";
import TriggerEditModal from "./TriggerEditModal.vue";

export default {
  components: { DataView, AutomationPreview, TriggerEditModal, ConfirmDialog },
  props: {
    triggerKey: { type: String },
    pluginKey: { type: String, required: true },
    mapping: {},
  },
  computed: {
    ...mapGetters("ipc", ["plugins"]),
  },
  methods: {
    async tryDelete() {
      if (
        await this.$refs.deleteDlg.open(
          "Confirm",
          "Are you sure you want to delete this trigger?"
        )
      ) {
        //Delete the command
        this.$emit("delete");
      }
    },
  },
};
</script>

<style>
</style>