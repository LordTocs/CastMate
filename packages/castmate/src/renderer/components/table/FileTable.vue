<template>
    <link-table :items="files" :name="name" :nameProp="nameProp" @nav="$emit('nav', $event)" @create="tryCreate">
        <template #item-input="{ item }">
            <v-btn size="small" class="mx-1" icon="mdi-delete" @click.stop="tryDelete(item)" />
            <v-btn size="small" class="mx-1" icon="mdi-content-copy" @click.stop="tryDuplicate(item)" />
            <v-btn size="small" class="mx-1" icon="mdi-pencil" @click.stop="tryRename(item)" />
        </template>
    </link-table>
    <confirm-dialog ref="deleteDlg" />
    <named-item-confirmation ref="duplicateDlg" />
    <named-item-modal ref="addModal" :header="`Create New ${name}`" label="Name" @created="f => $emit('create', f)" />
</template>

<script>
import ConfirmDialog from '../dialogs/ConfirmDialog.vue';
import NamedItemConfirmation from '../dialogs/NamedItemConfirmation.vue';
import NamedItemModal from '../dialogs/NamedItemModal.vue';
import LinkTable from './LinkTable.vue';

export default {
    components: { ConfirmDialog, NamedItemConfirmation, NamedItemModal, LinkTable },
    props: {
        name: { type: String },
        nameProp: { type: String, default: () => 'name' },
        idProp: { type: String, default: () => 'id' },
        files: {}
    },
    emits: ["nav", "delete", "duplicate", "rename", "create"],
    methods: {
        tryCreate() {
            this.$refs.addModal.open()
        },
        getName(file) {
            if (file instanceof String || typeof file === 'string')
            {
                return file;
            }
            return file[this.fileNameProp];
        },
        async tryDelete(file) {
            if (
                await this.$refs.deleteDlg.open(
                    "Confirm",
                    `Are you sure you want to delete ${this.getName(file)}?`
                )
            ) {
                this.$emit('delete', file);
            }
        },
        async tryDuplicate(file) {
            if (
                await this.$refs.duplicateDlg.open(
                    `Duplicate ${this.getName(file)}?`,
                    `New ${this.name} Name`,
                    "Duplicate",
                    "Cancel"
                )
            ) {
                const newName = this.$refs.duplicateDlg.name;

                this.$emit('duplicate', file, newName);
            }
        },
        async tryRename(file) {
            if (
                await this.$refs.duplicateDlg.open(
                    `Rename ${this.getName(file)}?`,
                    `New ${this.name} Name`,
                    "Rename",
                    "Cancel"
                )
            ) {
                this.$emit('rename', this.getName(file), newName);
            }
        },
    },
}
</script>

<style scoped>
</style>