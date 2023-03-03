import axios from "axios"
import https from "https"
import fs from "fs"
import _ from "lodash"

export default {
	name: "aoe4",
	uiName: "Age Of Empires 4",
	icon: "mdi-crown",
	color: "#619DB7",
	async init() {
		this.maps = [
			"Dry Arabia",
			"Lipany",
			"High View",
			"Mountain Pass",
			"Ancient Spires",
			"Danube River",
			"Black Forest",
			"Mongolian Heights",
			"Altai",
			"Confluence",
			"French Pass",
			"Hill and Dale",
			"King of the Hill",
			"Warring Islands",
			"Archipelago",
			"Nagari",
			"Boulder Bay",
		]

		this.civs = [
			"Abbasid Dynasty",
			"Chinese",
			"Delhi Sultanate",
			"English",
			"French",
			"Holy Roman Empire",
			"Mongols",
			"Rus",
		]
	},
	state: {
		aoe4Map: {
			name: "Current AoE4 Map",
			type: String,
		},
		aoe4Opponent: {
			name: "Current AoE4 Opponent",
			type: String,
		},
		aoe4OpponentRating: {
			name: "Current AoE4 Opponent Rating",
			type: Number,
		},
		aoe4OpponentCiv: {
			name: "Current AoE4 Opponent Rating",
			type: String,
		},
		aoe4Rating: {
			name: "Your current AoE4 Rating",
			type: Number,
		},
		aoe4Civ: {
			name: "Your current AoE4 Civ",
			type: String,
		},
	},
	methods: {
		getRandomCiv() {
			const civNames = [
				"English",
				"French",
				"Chinese",
				"Delhi Sultanate",
				"Abbasid Dynasty",
				"Holy Roman Empire",
				"Rus",
				"Mongols",
			]

			const randomCiv =
				civNames[Math.floor(Math.random() * civNames.length)]
			return randomCiv
		},
		async loadCamelFact() {
			return fs.promises
				.readFile("user/data/camel-facts.json", (err, data) => {
					if (err) throw err
				})
				.then(JSON.parse)
		},

		async getCamelFact() {
			let camelFacts = await this.loadCamelFact()
			return _.sample(camelFacts["facts"])
		},
	},
	templateFunctions: {
		async getMatchInfo(profileID) {
			const agent = new https.Agent({
				rejectUnauthorized: false,
			})

			let response = await axios.get(
				"https://aoeiv.net/api/player/matches",
				{
					httpsAgent: agent,
					params: {
						game: "aoe4",
						profile_id: 707064,
						count: 1,
					},
				}
			)

			let result = response.data[0]

			// formattedResult.streak = result.streak;

			// TODO - format return data for output
			console.log(response.data[0].players)

			this.state.aoe4Civ = this.civs[result.players[0].civ]
			this.state.aoe4Rating = result.players[0].rating

			this.state.aoe4Opponent = result.players[1].name
			this.state.aoe4OpponentCiv = this.civs[result.players[1].civ]
			this.state.aoe4OpponentRating = result.players[1].rating

			this.state.aoe4Map = this.maps[result.map_type]

			let playerNames = `Player 1: ${result.players[0].name} ${
				this.civs[result.players[0].civ]
			} ${result.players[0].rating} - Player 2: ${
				result.players[1].name
			} ${result.players[1].rating} ${
				this.civs[result.players[1].civ]
			} Map: ${this.maps[result.map_type]}`
			return playerNames
		},

		getRandomCiv() {
			return this.getRandomCiv()
		},
		getCamelFact() {
			return this.getCamelFact()
		},

		get5RandomCivs() {
			let civs = []
			let count = 0
			while (civs.length < 5) {
				let randomCiv = this.getRandomCiv()
				if (!civs.includes(randomCiv)) {
					civs.push(randomCiv)
					count++
				}
			}
			let civString = `Civ Poll Options: ${civs[0]}, ${civs[1]}, ${civs[2]}, ${civs[3]}, ${civs[4]}`
			return civString
		},
		async giveFreeElo(playerName) {
			if (!playerName.length) {
				return "Enter a player name to gift them extra Elo!"
			}

			if (!playerName || !playerName.length) {
				playerName = this.settings.aoeUsername
			}

			const agent = new https.Agent({
				rejectUnauthorized: false,
			})

			let response = await axios.get(
				"https://aoe4world.com/api/v0/players/search",
				{
					httpsAgent: agent,
					params: {
						query: playerName,
					},
				}
			)

			if (response.data) {
				let leaderboard = response.data.players[0].leaderboards.rm_1v1

				let formattedResult = {}
				formattedResult.userName = response.data.players[0].name
				formattedResult.originalElo = leaderboard.rating
				formattedResult.newElo = parseInt(leaderboard.rating) + 500
				formattedResult.rank = leaderboard.rank
				formattedResult.winPercent = leaderboard.win_rate
				formattedResult.wins = leaderboard.wins_count
				formattedResult.losses = leaderboard.losses_count
				formattedResult.streak = leaderboard.streak

				let playerStatString = `⚔️ ${formattedResult.userName} ⚔️ Original ELO: ${formattedResult.originalElo} - New Elo: ${formattedResult.newElo}...thanks ${this.settings.aoeUsername}, I'll definitely be subscribing to your Twitch!`
				console.log(playerStatString)
				return playerStatString
			} else {
				return "Could not find player."
			}
		},

		async getAoe4PlayerStat(playerName) {
			if (!playerName || !playerName.length) {
				playerName = this.settings.aoeUsername
			}

			const agent = new https.Agent({
				rejectUnauthorized: false,
			})

			let response = await axios.get(
				"https://aoe4world.com/api/v0/players/search",
				{
					httpsAgent: agent,
					params: {
						query: playerName,
					},
				}
			)

			if (response.data) {
				let leaderboard = response.data.players[0].leaderboards.rm_1v1

				let formattedResult = {}
				formattedResult.userName = response.data.players[0].name
				formattedResult.elo = leaderboard.rating
				formattedResult.rank = leaderboard.rank
				formattedResult.winPercent = leaderboard.win_rate
				formattedResult.wins = leaderboard.wins_count
				formattedResult.losses = leaderboard.losses_count
				formattedResult.streak = leaderboard.streak

				let playerStatString = `⚔️ ${formattedResult.userName} ⚔️ Rank: ${formattedResult.rank} - Elo: ${formattedResult.elo} - Win Rate: ${formattedResult.winPercent}% - W/L: ${formattedResult.wins}/${formattedResult.losses} - Streak: ${formattedResult.streak}`

				console.log(playerStatString)
				return playerStatString
			} else {
				return "Could not find player."
			}
		},

		//TODO - needs to be updated to new API
		async getAoe4Top3() {
			let response = await axios.post(
				"https://api.ageofempires.com/api/ageiv/Leaderboard",
				{
					region: 7,
					versus: "players",
					matchType: "unranked",
					teamSize: "1v1",
					searchPlayer: "",
					page: 1,
					count: 1,
				}
			)

			if (
				response.data &&
				response.data.items &&
				response.data.items.length
			) {
				let items = response.data.items
				let playerString = `🥇${items[0].userName}🥇 🥈${items[1].userName}🥈 🥉${items[2].userName}🥉`

				return playerString
			} else {
				return "Could not find player."
			}
		},
	},
	settings: {
		aoeUsername: { type: String },
		enabled: { type: Boolean },
	},
}
