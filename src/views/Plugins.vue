<template>
  <div>Plugins Worked {{$route.params.name}}</div>
</template>

<script>
import { mapGetters } from "vuex";

export default {
  computed: {
    ...mapGetters("ipc", ["inited", "plugins"])
  }
};
</script>

<style scoped>
</style>