<template>
  <div>
    <v-row v-for="plugin in triggerPlugins" :key="plugin.name">
      <v-col>
        <profile-plugin :plugin="plugin" />
      </v-col>
    </v-row>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import ProfilePlugin from "./ProfilePlugin.vue";

export default {
  props: {
    value: {},
  },
  components: {
    ProfilePlugin,
  },
  computed: {
    ...mapGetters("ipc", ["triggers", "plugins"]),
    triggerPlugins() {
      return this.plugins.filter((p) => Object.keys(p.triggers).length > 0);
    },
  },
};
</script>

<style scoped>
.center-this {
  display: flex;
  flex-direction: row;
  justify-content: center;
}
</style>