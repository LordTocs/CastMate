<template>
  <v-expansion-panel>
    <v-expansion-panel-header>
      <v-row no-gutters>
        <v-col>
          <v-text-field
            :value="keyValue"
            :label="label"
			@click.stop="(event) => event.stopPropagation()"
            @input="(v) => $emit('key-change', v)"
          />
        </v-col>
        <div style="margin-left: 12px; margin-right: 12px;">
          <v-btn @click.stop="$emit('delete')"> Delete </v-btn>
        </div>
      </v-row>
    </v-expansion-panel-header>
    <v-expansion-panel-content>
      <slot />
    </v-expansion-panel-content>
  </v-expansion-panel>
</template>

<script>
export default {
  props: {
    label: {},
    keyValue: {},
  },
};
</script>

<style>
</style>