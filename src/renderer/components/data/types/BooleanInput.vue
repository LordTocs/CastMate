<template>
 <div class="d-flex flex-row">
    <div
      v-if="schema.leftLabel"
      style="margin-top: 20px; margin-bottom: 8px; height: 24px"
      class="d-flex align-center mr-2"
    >
      <label class="v-label">{{ schema.leftLabel }} </label>
    </div>
    <v-switch v-model="modelObj" inset density="compact">
      <template v-slot:label>
        {{ schema.name || label }}
        <v-btn
          v-if="!schema.required"
          icon="mdi-close"
          flat
          size="x-small"
          class="mx-1"
          @click.stop="clear"
        />
      </template>
    </v-switch>
  </div>
</template>

<script>
import { mapModel } from '../../../utils/modelValue';

export default {
    props: {
        modelValue: {},
        schema: {},
        label: {},
    },
    emits: ['update:modelValue'],
    methods: {
        clear() {
            this.$emit("update:modelValue", undefined)
        }
    },
    computed: {
        ...mapModel()
    }
}
</script>