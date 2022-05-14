<template>
  <div v-if="!schema || value === undefined" />
  <p
    v-else-if="
      schema.type == 'String' ||
      schema.type == 'Number' ||
      schema.type == 'Boolean' ||
      schema.type == 'FilePath' ||
      schema.type == 'Automation'
    "
  >
    <span class="text--secondary" v-if="schema.name || label">
      {{ schema.name || label }}:
    </span>
    {{ value }}
  </p>
  <p v-else-if="schema.type == 'LightColor'">
    <span class="text--secondary" v-if="schema.name || label">
      {{ schema.name || label }}:
    </span>
    <color-swatch :value="value" />
  </p>
  <p v-else-if="schema.type == 'ChannelPointReward'">
    <span class="text--secondary" v-if="schema.name || label">
      {{ schema.name || label }}: </span
    >{{ value }}
    <!--reward-edit-button :rewardName="value" /-->
  </p>
  <div
    v-else-if="schema.type == 'Object' && schema.properties"
    :class="[{ 'horizontal-layout': horizontal }]"
  >
    <data-view
      v-for="key in previewProperties"
      :key="key"
      :schema="schema.properties[key]"
      :value="value[key]"
      :horizontal="horizontal"
    />
  </div>
  <p v-else-if="schema.type == 'Range' && value">
    <span class="text--secondary" v-if="schema.name || label">
      {{ schema.name || label }}: </span
    >{{ value.min ? value.min : `-∞` }} ⟶ {{ value.max ? value.max : `∞` }}
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
    horizontal: { type: Boolean, default: () => false },
  },
  computed: {
    previewProperties() {
      return Object.keys(this.value).filter(
        (k) => this.schema.properties[k].preview != false
      );
    },
  },
};
</script>

<style scoped>
.one-text-line {
  text-overflow: ellipsis;
}
p:last-child {
  margin-bottom: 0px;
}
.horiztonal-layout {
  display: flex;
  flex-direction: row;
}
</style>