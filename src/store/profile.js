import fs from 'fs';
import YAML from 'yaml';
import path from 'path';
import Vue from 'vue';
import { changeObjectKey } from '../utils/objects';


export default {
	namespaced: true,
	state()
	{
		return {
			profilePath: null,
			dirty: false,
			profile: {},
		}
	},
	getters: {
		profilePath: (state) => state.profilePath,
		dirty: (state) => state.dirty,
		profile: (state) => state.profile,
	},
	mutations: {
		loadedProfile(state, { profilePath, profile })
		{
			state.profilePath = profilePath;
			state.dirty = false;
			state.profile = profile;
		},
		markClean(state)
		{
			state.dirty = false;
		},
		changeCommand(state, { triggerKey, commandKey, command})
		{
			if (!(triggerKey in state.profile.triggers))
			{
				Vue.set(state.profile.triggers, triggerKey, {});
			}
			Vue.set(state.profile.triggers[triggerKey], commandKey, command);
			state.dirty = true;
		},
		deleteCommand(state, { triggerKey, commandKey})
		{
			if (!(triggerKey in state.profile.triggers))
			{
				return;
			}
			Vue.delete(state.profile.triggers[triggerKey], commandKey);
			state.dirty = true;
		},
		renameCommand(state, { triggerKey, oldKey, newKey })
		{
			if (!(triggerKey in state.profile.triggers))
			{
				return;
			}
			Vue.set(state.profile.triggers, triggerKey, changeObjectKey(state.profile.triggers[triggerKey], oldKey, newKey));
			state.dirty = true;
		}

	},
	actions: {
		async loadProfile({ commit, rootGetters }, name)
		{
			const profilePath = path.join(rootGetters['ipc/paths'].userFolder, 'profiles', name + '.yaml')
			const profile = YAML.parse(await fs.promises.readFile(profilePath, 'utf-8')) || {};
			commit('loadedProfile', { profilePath, profile});
		},
		async saveProfile({ commit, getters })
		{
			await fs.promises.writeFile(getters.profilePath, YAML.stringify(getters.profile));
			commit('markClean');
		}
	}
}