import fs from 'fs';
import YAML from 'yaml';

export default {
	namespaced: true,
	state()
	{
		return {
			segments: []
		}
	},
	getters: {
		segments: (state) =>
		{
			return state.segments;
		},
	},
	mutations: {
		setSegments(state, segments)
		{
			state.segments = segments;
		}
	},
	actions: {
		async loadSegments({ commit, rootGetters })
		{
			const segments = YAML.parse(await fs.promises.readFile(rootGetters['ipc/paths'].segmentsFilePath, 'utf-8')) || {};
			commit('setSegments', segments);
		},
		async updateSegment({ commit, getters, rootGetters }, { index, segment })
		{
			const newSegments = [...getters.segments];

			newSegments[index] = segment;

			await fs.promises.writeFile(rootGetters['ipc/paths'].segmentsFilePath, YAML.stringify(newSegments), 'utf-8');

			commit('setSegments', newSegments);
		},
		async removeSegment({ commit, getters, rootGetters }, index)
		{
			const newSegments = [...getters.segments];

			newSegments.splice(index,  1);

			await fs.promises.writeFile(rootGetters['ipc/paths'].segmentsFilePath, YAML.stringify(newSegments), 'utf-8');

			commit('setSegments', newSegments);
		},
		async addSegment({ commit, getters, rootGetters }, segment)
		{
			const newSegments = [...getters.segments];

			newSegments.push(segment);

			await fs.promises.writeFile(rootGetters['ipc/paths'].segmentsFilePath, YAML.stringify(newSegments), 'utf-8');

			commit('setSegments', newSegments);
		},
	}
}