<template>
  <div v-if="!schema || value === undefined" />
  <p
    v-else-if="
      schema.type == 'String' ||
      schema.type == 'Number' ||
      schema.type == 'FilePath' ||
      schema.type == 'Automation' ||
      schema.type == 'Duration'
    "
  >
    <span class="text--secondary" v-if="schema.name || label">
      {{ schema.name || label }}:
    </span>
    {{ value }}{{ schema.unit ? schema.unit.short : "" }}
  </p>
  <p v-else-if="schema.type == 'Boolean'">
    <span class="text--secondary" v-if="schema.name || label">
      {{ schema.name || label }}:
    </span>
    <v-icon> {{ value ? (schema.trueIcon ? schema.trueIcon : 'mdi-check-bold' ) : (schema.falseIcon ? schema.falseIcon : 'mdi-close-bold' ) }} </v-icon>
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
    >{{ value.min != undefined && value.min != null ? value.min : `-∞` }} ⟶
    {{ value.max != undefined && value.max != null ? value.max : `∞` }}
  </p>
  <spellcast-hook-view v-else-if="schema.type == 'SpellcastHook' && value" :hookId="value" />
</template>

<script>
import ColorSwatch from "./ColorSwatch.vue";
import SpellcastHookView from "../spellcast/SpellcastHookView.vue";
export default {
  components: { ColorSwatch, SpellcastHookView },
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
        (k) => this.schema.properties[k]?.preview != false
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