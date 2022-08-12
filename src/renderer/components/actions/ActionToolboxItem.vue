<template>
<v-list-item
    style="cursor: grab; user-select: none;"
    :prepend-icon="actionDefinition?.icon
            ? actionDefinition?.icon
            : 'mdi-file-document-outline'"
    :title="actionDefinition?.name"
    :subtitle="actionDefinition?.description"
    :color="actionDefinition?.color"
/>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
    props: {
        pluginAction: {}
    },
    computed: {
        ...mapGetters("ipc", ["plugins"]),
        actionDefinition() {
            return this.plugins[this.pluginAction.plugin]?.actions?.[this.pluginAction.action];
        }
    }
}
</script>

<style scoped>
</style>