<template>
  <v-container fluid>
    <link-table :items="overlayItems" name="Overlays" @nav="onNav" @create="tryCreate">
      <template #item-input="{ item} ">
        <v-btn size="small" class="mx-1" icon="mdi-delete" @click.stop="tryDelete(item)" />
        <v-btn size="small" class="mx-1" icon="mdi-content-copy" @click.stop="tryDuplicate(item)" />
        <v-btn size="small" class="mx-1" icon="mdi-pencil" @click.stop="tryRename(item)" />
      </template>
    </link-table>
  </v-container>
  <named-item-confirmation ref="duplicateDlg" />
  <confirm-dialog ref="deleteDlg" />
  <overlay-creation-dialog ref="createDlg" header="Create New Overlay"/>
</template>


<script>
import LinkTable from "../components/table/LinkTable.vue"
import ConfirmDialog from "../components/dialogs/ConfirmDialog.vue"
import NamedItemConfirmation from "../components/dialogs/NamedItemConfirmation.vue"
import OverlayCreationDialog from "../components/overlays/OverlayCreationDialog.vue"
import { mapResourceArray, mapResourceFunctions } from '../utils/resources'

export default {
  components: { LinkTable, ConfirmDialog, NamedItemConfirmation, OverlayCreationDialog },
  computed: {
    ...mapResourceArray('overlay'),
    overlayItems() {
      return this.overlays.map(o => ({id: o.id, name: o.config.name }))
    }
  },
  methods: {
    ...mapResourceFunctions('overlay'),
    onNav(overlay) {
      this.$router.push(`/overlays/${overlay.id}`)
    },
    async tryCreate() {
      const config = await this.$refs.createDlg.open();
      if (config) {
        const result = await this.createOverlay({ ...config, widgets: [] })
        this.$router.push(`/overlays/${result.id}`)
      }
    },
    async tryDuplicate(overlay) {
      if (
          await this.$refs.duplicateDlg.open(
              `Duplicate ${overlay.name}?`,
              `New Overlay's Name`,
              "Duplicate",
              "Cancel"
          )
      ) {
          const newName = this.$refs.duplicateDlg.name;

          const newOverlay = await this.cloneOverlay(overlay.id);
          await this.setOverlayConfig(newOverlay.id, { ...newOverlay.config, name: newName });
          this.$router.push(`/overlays/${newOverlay.id}`)
      }
    },
    async tryDelete(overlay) {
      if (
          await this.$refs.deleteDlg.open(
              "Confirm",
              `Are you sure you want to delete ${overlay.name}?`
          )
      ) {
          await this.deleteOverlay(overlay.id);
      }
    }
  }
}

</script>

<style scoped>
</style>