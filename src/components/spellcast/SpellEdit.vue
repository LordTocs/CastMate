<template>
  <div>
    <v-text-field
      label="Name"
      :value="value.name"
      @change="(v) => $subEmit('input', 'name', v)"
    />
    <v-text-field
      label="Description"
      :value="value.description"
      @change="(v) => $subEmit('input', 'description', v)"
    />
  </div>
</template>

<script>
export default {
  props: {
    value: {},
  },
};
</script>

<style>
</style>