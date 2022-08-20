<template>
  <v-card>
    <v-card-title>
      <v-text-field
          v-model="title"
          label="Title"
          counter
          maxlength="140"
      />
      </v-card-title>
      <v-card-text>
      <!--v-text-field
          :value="segment.goLive || ''"
          @change="(gl) => updateGoLive(i, gl)"
          label="Go Live"
          counter
          maxlength="140"
      /-->
      <category-search
          v-model="category"
      />
      <tag-select
          v-model="tags"
      />
      <automation-input
          v-model="automation"
          label="Segment Start Automation"
      />
      </v-card-text>
      <v-card-actions>
      <v-btn color="primary" variant="outlined" @click="$emit('activate')">
          <v-icon> mdi-play </v-icon> Activate
      </v-btn>
      <v-spacer />
      <v-btn icon @click="$emit('delete')">
          <v-icon> mdi-cancel </v-icon>
      </v-btn>
    </v-card-actions>
</v-card>
</template>

<script>
import { mapModelValues } from '../../utils/modelValue';
import AutomationInput from '../automations/AutomationInput.vue';
import CategorySearch from "../data/CategorySearch.vue";
import TagSelect from "../data/TagSelect.vue";

export default {
    props: {
        modelValue: {},
    },
    emits: ["update:modelValue", "delete", "activate"],
    components: {
        AutomationInput,
        CategorySearch,
        TagSelect
    },
    computed: {
        ...mapModelValues(["title", "category", "tags", "automation"])
    }
}
</script>