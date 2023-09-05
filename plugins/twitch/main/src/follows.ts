import { defineTrigger } from "castmate-core"
import { onChannelAuth } from "./api-harness"

export function setupFollows() {
	const follow = defineTrigger({
		id: "follow",
		name: "Followed",
		icon: "mdi mdi-heart",
		version: "0.0.1",
		config: {
			type: Object,
			properties: {},
		},
		context: {
			type: Object,
			properties: {
				user: { type: String, required: true },
				userId: { type: String, required: true },
				userColor: { type: String, required: true },
			},
		},
		async handle(config, context) {
			return true
		},
	})

	onChannelAuth((account, service) => {
		service.eventsub.onChannelFollow(account.twitchId, account.twitchId, (event) => {
			follow({
				user: event.userDisplayName,
				userId: event.userId,
				userColor: "#000000",
			})
		})
	})
}
