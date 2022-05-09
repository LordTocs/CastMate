<template>
  <div v-if="!schema || value === undefined" />
  <p
    class="one-text-line"
    v-else-if="
      schema.type == 'String' ||
      schema.type == 'Number' ||
      schema.type == 'Boolean' ||
      schema.type == 'FilePath' ||
      schema.type == 'Automation'
    "
  >
    <span v-if="schema.name || label"> {{ schema.name || label }}: </span>
    {{ value }}
  </p>
  <p v-else-if="schema.type == 'LightColor'">
    <span v-if="schema.name || label"> {{ schema.name || label }}: </span>
    <color-swatch :value="value" />
  </p>
  <p v-else-if="schema.type == 'ChannelPointReward'">
    {{ value }}
    <!--reward-edit-button :rewardName="value" /-->
  </p>
  <div v-else-if="schema.type == 'Object' && schema.properties">
    <data-view
      v-for="key in previewProperties"
      :key="key"
      :schema="schema.properties[key]"
      :value="value[key]"
    />
  </div>
  <p v-else-if="schema.type == 'Range' && value">
    {{ value.min ? value.min : `-∞` }} ⟶ {{ value.max ? value.max : `∞` }}
  </p>
</template>

<script>
import RewardEditButton from "../rewards/RewardEditButton.vue";
import ColorSwatch from "./ColorSwatch.vue";
export default {
  components: { ColorSwatch, RewardEditButton },
  name: "data-view",
  props: {
    schema: {},
    value: {},
    label: {},
  },
  computed: {
    previewProperties() {
      return Object.keys(this.value).filter(k => this.schema.properties[k].preview != false);
    }
  }
};
</script>

<style scoped>
.one-text-line {
  text-overflow: ellipsis;
}
</style>