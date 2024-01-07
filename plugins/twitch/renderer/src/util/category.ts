import { TwitchCategory } from "castmate-plugin-twitch-shared"
import { useIpcCaller } from "castmate-ui-core"
import { defineStore } from "pinia"

export const useCategoryStore = defineStore("twitch-categories", () => {
	const searchCategories = useIpcCaller<(query: string) => TwitchCategory[]>("twitch", "searchCategories")
	const getCategoryById = useIpcCaller<(id: string) => TwitchCategory | undefined>("twitch", "getCategoryById")

	async function initialize() {}

	return {
		searchCategories,
		getCategoryById,
		initialize,
	}
})
