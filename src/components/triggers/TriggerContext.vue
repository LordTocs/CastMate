<template>
  <v-sheet rounded outlined class="px-2 py-2 my-4">
    <p class="my-2">Template Variables</p>
    <p class="text--secondary my-1">
      These are the variables usable in <code v-pre>{{&nbsp;templates&nbsp;}}</code
      >.
    </p>
    <v-divider class="my-2" />
    <v-simple-table>
      <thead>
        <td>Variable</td>
        <td>Type</td>
      </thead>
      <tbody>
        <template v-if="triggerSpec">
        <tr
          v-for="contextKey in Object.keys(triggerSpec.context)"
          :key="contextKey"
        >
          <td>
            <code>{{ contextKey }}</code>
          </td>
          <td>
            {{ triggerSpec.context[contextKey].type }}
          </td>
        </tr>
        </template>
        <tr>
          <td colspan="2">
            <p class="text-center my-0 text-h6">State</p>
          </td>
        </tr>

        <tr v-for="state in stateVariables" :key="state.variable">
          <td>
            <code> {{ state.variable }} </code>
          </td>
          <td>
            {{ state.type }}
          </td>
        </tr>
      </tbody>
    </v-simple-table>
  </v-sheet>
</template>

<script>
import { mapGetters } from "vuex";
export default {
  props: {
    triggerSpec: {},
  },
  computed: {
    ...mapGetters("ipc", ["stateLookup", "plugins"]),
    ...mapGetters("variables", ["variables"]),
    stateVariables() {
      const result = [];
      for (let pluginKey in this.stateLookup) {
        for (let stateKey in this.stateLookup[pluginKey]) {
          console.log("State Vars", pluginKey, stateKey);
          result.push({
            variable: `${pluginKey}.${stateKey}`,
            color: this.plugins[pluginKey].color,
            type: (
              this.plugins[pluginKey].stateSchemas[stateKey] ||
              this.variables[stateKey]
            ).type,
          });
        }
      }
      return result;
    },
  },
};
</script>

<style>
</style>