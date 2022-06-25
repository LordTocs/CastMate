
import { mapIpcs } from "../utils/ipcMap";

const spellCastIPCs = {
    ...mapIpcs("spellcast", ["getSpellHooks", "createSpellHook", "updateSpellHook", "deleteSpellHook"])
}

export default {
	namespaced: true,
	state()
	{
		return {
			spellHooks: [],
		}
	},
	getters: {
		spellHooks: (state) => state.spellHooks
	},
	mutations: {
		setSpellHooks(state, spellHooks)
		{
			state.spellHooks = spellHooks;
		},
	},
	actions: {
		async loadSpellHooks({ commit })
		{
			const buttons = await spellCastIPCs.getSpellHooks();
			commit('setSpellHooks', buttons);
		},
		async updateSpellHook({ commit }, { hookId, hookData })
		{
			await spellCastIPCs.updateSpellHook(hookId, hookData);
            const buttons = await spellCastIPCs.getSpellHooks();
			commit('setSpellHooks', buttons);
		},
		async deleteSpellHook({ commit }, { hookId })
		{
			await spellCastIPCs.deleteSpellHook(hookId);
            const buttons = await spellCastIPCs.getSpellHooks();
			commit('setSpellHooks', buttons);
		},
		async createSpellHook({commit }, { hookData })
		{
			await spellCastIPCs.createSpellHook(hookData);
            const buttons = await spellCastIPCs.getSpellHooks();
			commit('setSpellHooks', buttons);
		}
	}
}