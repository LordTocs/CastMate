import { defineAction, defineTrigger, onLoad, onUnload, definePlugin, usePluginLogger } from "castmate-core"
import https from "https"
import axios from "axios"

const emptyPlayerStat = {
	userName: "Player Not Found",
	profileLink: "",
	elo: 0,
	rank: 0,
	winPercent: 0,
	wins: 0,
	losses: 0,
	streak: 0,
}

export default definePlugin(
	{
		id: "aoe4",
		name: "AoE4",
		description: "Tools for Age of Empires IV",
		color: "#3B82CE",
		icon: "mdi mdi-chess-king",
	},
	() => {
		//Plugin Intiialization
		const logger = usePluginLogger()
		defineAction({
			id: "getStats",
			name: "Player Stats",
			config: {
				type: Object,
				properties: {
					playerName: {
						type: String,
						name: "Player Name",
						required: true,
						default: "FitzBro",
						template: true,
					},
				},
			},
			result: {
				type: Object,
				properties: {
					userName: { type: String, required: true },
					profileLink: { type: String, required: true },
					elo: { type: Number, required: true },
					rank: { type: Number, required: true },
					winPercent: { type: Number, required: true },
					wins: { type: Number, required: true },
					losses: { type: Number, required: true },
					streak: { type: Number, required: true },
				},
			},
			async invoke(config, contextData, abortSignal) {
				// Handle empty playerName
				if (!config.playerName) {
					return emptyPlayerStat
				}

				// Query AoE4 World
				const agent = new https.Agent({
					rejectUnauthorized: false,
				})
				const response = await axios.get("https://aoe4world.com/api/v0/players/search", {
					httpsAgent: agent,
					params: {
						query: config.playerName,
					},
				})
				if (response.data) {
					const players = response.data.players as {
						name: string
						profile_id: string
						[key: PropertyKey]: any
					}[]

					const exactPlayer = players.find((p) => p.name.toLowerCase() == config.playerName.toLowerCase())
					const player = exactPlayer ?? players[0]

					logger.log(player)

					if (!player) return emptyPlayerStat

					const leaderboard1v1 = player.leaderboards.rm_solo ?? player.leaderboards.rm_1v1_console
					if (!leaderboard1v1) return emptyPlayerStat

					return {
						userName: player.name,
						profileLink: `https://aoe4world.com/players/${player.profile_id}`,
						elo: leaderboard1v1.rating,
						rank: leaderboard1v1.rank,
						winPercent: leaderboard1v1.win_rate,
						wins: leaderboard1v1.wins_count,
						losses: leaderboard1v1.losses_count,
						streak: leaderboard1v1.streak,
					}
				} else {
					return emptyPlayerStat
				}
			},
		})
	}
)
