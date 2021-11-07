import fs from 'fs';
import YAML from 'yaml';
import _ from 'lodash';
import { changeObjectKey } from '../utils/objects';

export default {
	namespaced: true,
	state()
	{
		return {
			variables: {},
			variableValues: {},
		}
	},
	getters: {
		variables: (state) =>
		{
			return state.variables;
		},
	},
	mutations: {
		setVariables(state, variables)
		{
			state.variables = variables;
		}
	},
	actions: {
		async loadVariables({ commit, rootGetters })
		{
			const variables = YAML.parse(await fs.promises.readFile(rootGetters['ipc/paths'].variablesFilePath, 'utf-8')) || {};
			commit('setVariables', variables);
		},

		async updateVariable({ commit, getters, rootGetters }, { variableName, variableSpec })
		{
			const newVariables = _.cloneDeep(getters.variables);

			newVariables[variableName] = variableSpec;

			await fs.promises.writeFile(rootGetters['ipc/paths'].variablesFilePath, YAML.stringify(newVariables), 'utf-8');

			commit('setVariables', newVariables);
		},
		async changeVariableName({ commit, getters, rootGetters }, { oldName, newName })
		{
			const newVariables = changeObjectKey(getters.variables, oldName, newName);

			await fs.promises.writeFile(rootGetters['ipc/paths'].variablesFilePath, YAML.stringify(newVariables), 'utf-8');

			commit('setVariables', newVariables);
		},
		async removeVariable({ commit, getters, rootGetters }, { variableName })
		{
			const newVariables = _.cloneDeep(getters.variables);

			delete newVariables[variableName];

			await fs.promises.writeFile(rootGetters['ipc/paths'].variablesFilePath, YAML.stringify(newVariables), 'utf-8');

			commit('setVariables', newVariables);
		}
	}
}