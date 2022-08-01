<template>
  <v-text-field
    v-model.lazy="modelObj"
    :label="label"
    :type="this.allowTemplate ? undefined : 'number'"
    :clearable="clearable"
    @copy.stop=""
    @paste.stop=""
    :placeholder="placeholder"
  />
</template>

<script>
export default {
  props: {
    modelValue: {},
    label: {},
    allowTemplate: { type: Boolean, default: () => false },
    clearable: { type: Boolean, default: () => false },
    placeholder: {},
  },
  computed: {
    modelObj: {
      get() {
        return this.modelValue;
      },
      set(newValue) {
        if (newValue === null || String(newValue).trim() == "") {
          this.clear()
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