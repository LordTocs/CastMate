<template>
  <v-autocomplete
    multiple
    chips
    closable-chips
    :label="label"
    :items="tags"
    :loading="loading"
    item-title="name"
    item-value="id"    
    v-model="modelObj"
    prepend-icon="mdi-magnify"
  >
  </v-autocomplete>
</template>

<script>
import { mapIpcs } from '../../utils/ipcMap';
import { mapModel } from "../../utils/modelValue";
export default {
  props: {
    modelValue: {},
    label: { type: String, default: () => "Tags"},
  },
  emits: ["update:modelValue"],
  data() {
    return {
      tags: [],
      search: null,
      loading: false,
    };
  },
  computed: {
    ...mapModel(),
  },
  methods: {
    ...mapIpcs("twitch", ["getAllTags"]),
    remove(item) {
      const newValue = [...this.value];

      const i = newValue.findIndex((i) => i == item.id);

      if (i == -1) return;

      newValue.splice(i, 1);

      this.$emit("update:modelValue", newValue);
    },
    changed(newValue) {
      this.$emit("update:modelValue", newValue);
      this.search = null;
    },
  },
  async mounted() {
    this.loading = true;
    this.tags = await this.getAllTags();
    this.loading = false;
  }
};
</script>

<style>
</style>