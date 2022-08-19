<template>
    <v-card class="linktable-card">
        <div class="d-flex flex-row align-center my-2 mx-2">
            <v-btn color="primary" @click="tryCreate" class="mr-3"> Add {{ name}} </v-btn>
            <v-text-field v-model="search" append-inner-icon="mdi-magnify" label="Filter" single-line hide-details />
        </div>

        <v-table>
            <thead>
                <tr>
                    <th>
                        {{ name }}
                    </th>
                    <th> </th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="file in filteredFiles" :key="file" @click="$emit('nav', file)">
                    <td> {{ file }} </td>
                    <td class="d-flex flex-row justify-end align-center">
                        <v-btn size="small" class="mx-1" icon="mdi-delete" @click.stop="tryDelete(file)" />
                        <v-btn size="small" class="mx-1" icon="mdi-content-copy" @click.stop="tryDuplicate(file)" />
                        <v-btn size="small" class="mx-1" icon="mdi-pencil" @click.stop="tryRename(file)" />
                    </td>
                </tr>
            </tbody>
        </v-table>
        <confirm-dialog ref="deleteDlg" />
        <named-item-confirmation ref="duplicateDlg" />
        <named-item-modal ref="addModal" :header="`Create New ${name}`" label="Name"
            @created="f => $emit('create', f)" />

    </v-card>

</template>

<script>
import ConfirmDialog from '../dialogs/ConfirmDialog.vue';
import NamedItemConfirmation from '../dialogs/NamedItemConfirmation.vue';
import NamedItemModal from '../dialogs/NamedItemModal.vue';

export default {
    components: { ConfirmDialog, NamedItemConfirmation, NamedItemModal },
    props: {
        name: { type: String },
        files: {}
    },
    emits: ["nav", "delete", "duplicate", "rename", "create"],
    computed: {
        filteredFiles() {
            if (this.search.length == 0)
                return this.files;
            const searchLower = this.search.toLowerCase();
            return this.files.filter(f => f.toLowerCase().includes(searchLower)).sort();
        }
    },
    methods: {
        tryCreate() {
            this.$refs.addModal.open()
        },
        async tryDelete(name) {
            if (
                await this.$refs.deleteDlg.open(
                    "Confirm",
                    `Are you sure you want to delete ${name}?`
                )
            ) {
                this.$emit('delete', name);
            }
        },
        async tryDuplicate(name) {
            if (
                await this.$refs.duplicateDlg.open(
                    `Duplicate ${name}?`,
                    `New ${this.name} Name`,
                    "Duplicate",
                    "Cancel"
                )
            ) {
                const newName = this.$refs.duplicateDlg.name;

                this.$emit('duplicate', name, newName);
            }
        },
        async tryRename(name) {
            if (
                await this.$refs.duplicateDlg.open(
                    `Rename ${name}?`,
                    `New ${this.name} Name`,
                    "Rename",
                    "Cancel"
                )
            ) {
                this.$emit('rename', name, newName);
            }
        },
    },
    data() {
        return {
            search: "",
        }
    }
}
</script>

<style>
.linktable-card tbody tr {
    cursor: pointer;
}

.linktable-card tbody tr:nth-of-type(even) {
    background-color: #424242;
}

.linktable-card tbody tr:nth-of-type(odd) {
    background-color: #424242;
}

.linktable-card .v-data-table-header {
    background-color: #424242;
    color: white;
}

.linktable-card .v-data-footer {
    background-color: #424242;
}
</style>

<style scoped>
</style>