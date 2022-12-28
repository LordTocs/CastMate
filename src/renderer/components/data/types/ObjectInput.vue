<template>
  <div :class="{ 'object-group': isGroup }">
    <v-card-subtitle class="d-flex flex-row py-2 align-center" v-if="schema?.name">
        <div class="flex-grow-1 "> {{ schema.name }} </div> 
    </v-card-subtitle>
    <div :class="{ 'object-group-inner': isGroup }">
      <data-input
        v-for="propertyKey in propertiesKeys"
        :key="propertyKey"
        :schema="schema.properties[propertyKey]"
        :model-value="modelValue ? modelValue[propertyKey] : null"
        @update:model-value="(v) => updateObject(propertyKey, v)"
        :context="context"
        :secret="secret"
      />
    </div>
  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue'

export default {
  name: "object-input",
  components: { DataInput: defineAsyncComponent(() => import("../DataInput.vue")) },
  props: {
    modelValue: {},
    schema: {},
    context: {},
    secret: { type: Boolean, default: () => false }
  },
  computed: {
    isGroup() {
      return this.schema.name || this.schema.group
    },
    propertiesKeys() {
      return this.schema.properties ? Object.keys(this.schema.properties) : []
    }
  },
  methods: {
    updateObject(key, value) {
      let newValue = this.modelValue ? { ...this.modelValue } : {};

      if (value !== "" && value !== undefined) {
        newValue[key] = value;
      } else {
        console.log("Deleting Key", key);
        delete newValue[key];
      }

      this.$emit("update:modelValue", newValue);
    },
  },
};
</script>

<style scoped>
.object-row {
  flex: 1;
}

.object-group {
  border-radius: 4px;
  border: thin solid currentColor;
  margin-bottom: 12px;
}

.object-group-inner {
  padding-left: 20px;
  padding-right: 12px;
}
</style>