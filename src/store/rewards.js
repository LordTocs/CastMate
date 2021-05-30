import fs from 'fs';
import YAML from 'yaml';
import { changeObjectKey } from '../utils/objects';

export default {
	namespaced: true,
	state()
	{
		return {
			rewards: {},
		}
	},
	getters: {
		rewards: (state) =>
		{
			return Object.keys(state.rewards).map((k) =>
			{
				return { ...state.rewards[k], name: k };
			})
		},
	},
	mutations: {
		setRewards(state, rewards)
		{
			state.rewards = rewards;
		},
	},
	actions: {
		async loadRewards({ commit, rootGetters })
		{
			const rewards = YAML.parse(await fs.promises.readFile(rootGetters['ipc/paths'].rewardsFilePath, 'utf-8')) || {};
			commit('setRewards', rewards);
		},
		async updateReward({ commit, state, rootGetters }, { rewardName, newReward })
		{
			let newRewards = { ...state.rewards };

			console.log(rewardName)
			console.log(newReward);

			if (rewardName != newReward.name)
			{
				newRewards = changeObjectKey(newRewards, rewardName, newReward.name);
			}

			const name = newReward.name;

			const rewardMinusName = { ...newReward };
			delete rewardMinusName.name;

			newRewards[name] = rewardMinusName;

			await fs.promises.writeFile(rootGetters['ipc/paths'].rewardsFilePath, YAML.stringify(newRewards), 'utf-8');

			commit('setRewards', newRewards)
		},
		async deleteReward({ commit, state, rootGetters }, rewardName)
		{
			let newRewards = { ...state.rewards };
			delete newRewards[rewardName]

			await fs.promises.writeFile(rootGetters['ipc/paths'].rewardsFilePath, YAML.stringify(newRewards), 'utf-8');

			commit('setRewards', newRewards)
		},
		async createReward({commit, state, rootGetters}, newReward)
		{
			const rewardMinusName = { ...newReward };
			delete rewardMinusName.name;

			let newRewards = { ...state.rewards, [newReward.name]: rewardMinusName};

			await fs.promises.writeFile(rootGetters['ipc/paths'].rewardsFilePath, YAML.stringify(newRewards), 'utf-8');

			commit('setRewards', newRewards);
		}
	}
}