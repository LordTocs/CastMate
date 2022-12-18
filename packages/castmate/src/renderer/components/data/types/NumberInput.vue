<template>
  <v-text-field
    v-model.lazy="modelObj"
    :label="label"
    :type="this.allowTemplate ? undefined : 'number'"
    :clearable="clearable"
    @copy.stop=""
    @paste.stop=""
    :placeholder="placeholder"
    :density="density"
  >
    <template #append-inner>
      {{ unit?.name }}
    </template>
  </v-text-field>
</template>

<script>
export default {
  props: {
    modelValue: {},
    label: {},
    allowTemplate: { type: Boolean, default: () => false },
    clearable: { type: Boolean, default: () => false },
    placeholder: {},
    unit: {},
    density: { type: String },
  },
  computed: {
    modelObj: {
      get() {
        return this.modelValue;
      },
      set(newValue) {
        if (newValue === null || newValue == undefined || String(newValue).trim() == "") {
          return this.clear()
        }

        let number = Number(newValue);

        if (isNaN(number) && this.allowTemplate) {
          this.$emit("update:modelValue", newValue);
          return;
        } else if (!isNaN(number)) {
          this.$emit("update:modelValue", number);
        } else {
          this.clear();
        }
      }
    }
  },
  methods: {
    clear() {
      this.$emit('update:modelValue', undefined)
    }
  },
};
</script>

<style>
</style>