
import { mapIpcs } from "../utils/ipcMap";

const bitbuttonIpcs = {
    ...mapIpcs("bitbuttons", ["getButtonHooks", "createButtonHook", "updateButtonHook", "deleteButtonHook"])
}

export default {
	namespaced: true,
	state()
	{
		return {
			buttonHooks: [],
		}
	},
	getters: {
		buttonHooks: (state) => state.buttonHooks
	},
	mutations: {
		setButtonHooks(state, buttonHooks)
		{
			state.buttonHooks = buttonHooks;
		},
	},
	actions: {
		async loadButtonHooks({ commit })
		{
			const buttons = await bitbuttonIpcs.getButtonHooks();
			commit('setButtonHooks', buttons);
		},
		async updateButtonHook({ commit }, { hookId, hookData })
		{
			await bitbuttonIpcs.updateButtonHook(hookId, hookData);
            const buttons = await bitbuttonIpcs.getButtonHooks();
			commit('setButtonHooks', buttons);
		},
		async deleteButtonHook({ commit }, { hookId })
		{
			await bitbuttonIpcs.deleteButtonHook(hookId);
            const buttons = await bitbuttonIpcs.getButtonHooks();
			commit('setButtonHooks', buttons);
		},
		async createButtonHook({commit }, { hookData })
		{
			await bitbuttonIpcs.createButtonHook(hookData);
            const buttons = await bitbuttonIpcs.getButtonHooks();
			commit('setButtonHooks', buttons);
		}
	}
}