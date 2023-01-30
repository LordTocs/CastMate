<template>
  <v-sheet rounded variant="outlined" class="px-2 py-2 my-4">
    <p class="my-2">Template Variables</p>
    <p class="text--secondary my-1">
      These are the variables usable in <code v-pre>{{&nbsp;templates&nbsp;}}</code
      >.
    </p>
    <v-divider class="my-2" />
    <v-table>
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
    </v-table>
  </v-sheet>
</template>

<script>
import { mapState } from "pinia";
import { usePluginStore } from "../../store/plugins";
import { useVariableStore } from "../../store/variables";
export default {
  props: {
    triggerSpec: {},
  },
  computed: {
    ...mapState(usePluginStore, {
      rootState: "rootState",
      plugins: "plugins"
    }),
    ...mapState(useVariableStore, {
      variables: store => store.variableSpecs
    }),
    stateVariables() {
      const result = [];
      for (let pluginKey in this.rootState) {
        for (let stateKey in this.rootState[pluginKey]) {
          if (this.plugins[pluginKey]?.stateSchemas[stateKey]?.hidden) 
            continue;
            
          result.push({
            variable: `${pluginKey}.${stateKey}`,
            color: this.plugins[pluginKey]?.color || '#0f0f0f',
            type: (
              this.plugins[pluginKey]?.stateSchemas[stateKey] ||
              this.variables[stateKey]
            )?.type || 'Unknown',
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