import { TwitchViewerDisplayData } from "castmate-plugin-twitch-shared"
import { useIpcCaller } from "castmate-ui-core"
import { defineStore } from "pinia"

export const useViewerStore = defineStore("twitch-viewers", () => {
	const fuzzyGetUser = useIpcCaller<(query: string) => TwitchViewerDisplayData[]>("twitch", "fuzzyGetUsers")
	const getUserById = useIpcCaller<(userId: string) => TwitchViewerDisplayData>("twitch", "getUserById")
	const getUsersByIds = useIpcCaller<(userIds: string[]) => TwitchViewerDisplayData[]>("twitch", "getUsersByIds")
	const getUserByName = useIpcCaller<(displayName: string) => TwitchViewerDisplayData | undefined>(
		"twitch",
		"getUserByName"
	)

	return {
		fuzzyGetUser,
		getUserById,
		getUserByName,
		getUsersByIds,
	}
})
