const CSGameState = require('cs-gamestate');

module.exports = {
	name: "csgo",
	uiName: "Counter Strike",
	icon: "mdi-pistol",
	color: "#6E72AD",
	async init() {
		this.gamestateIntegration = new CSGameState({ createServer: false });
		this.installWebhook()

		this.gamestateIntegration.on('player.team', (team) => {
			this.state.team = team;
		})

		this.gamestateIntegration.on('round.bomb', (bombState) => {
			switch (bombState) {
				case 'planted':
					this.triggers.kill()
					break;
				case 'defused':
					this.triggers.bombDefused()
					break;
				case 'exploded':
					this.triggers.bombExploded()
					break;
			}
		});

		this.gamestateIntegration.on("player.state.health", (health) => {
			this.state.health = health;
		});

		this.gamestateIntegration.on('player.match_stats.kills', (kills) => {
			this.state.kills = kills;
			if (kills > 0) {
				this.triggers.kill({ kills })
			}
		})

		this.gamestateIntegration.on('player.match_stats.deaths', (deaths) => {
			this.state.deaths = deaths;
			if (deaths > 0) {
				this.triggers.death({ deaths });
			}
		})

		this.gamestateIntegration.on('player.match_stats.assists', (assists) => {
			this.state.assists = assists;
		})

		this.gamestateIntegration.on('round.win_team', (winTeam) => {

			if (winTeam == this.state.team) {
				this.triggers.roundWin();
			}
			else {
				this.triggers.roundLoss();
			}
		});
	},
	methods: {
		async installWebhook() {
			const routes = this.webServices.routes;
			routes.post(`/csgo`, (req, res) => {
				this.gamestateIntegration.parse(req.body);

				res.writeHead(200, { 'Content-Type': 'text/plain' });
				res.end();
			});
		}
	},
	settings: {
	},
	secrets: {
	},
	actions: {
	},
	state: {
		health: { type: Number, name: "Health" },
		kills: { type: Number, name: "Kills" },
		deaths: { type: Number, name: "Deaths" },
		assists: { type: Number, name: "Assists" },
	},
	triggers: {
		death: {
			name: "Death",
			type: "NumberTrigger",
			numberText: "Deaths",
			key: "deaths",
			description: "Triggered on when you die in CS:GO"
		},
		kill: {
			name: "Kill",
			type: "NumberTrigger",
			numberText: "Kills",
			key: "kills",
			description: "Triggered when you get a kill in CS:GO"
		},
		bombPlant: {
			name: "Bomb Planted",
			type: "SingleTrigger",
			description: "Triggered when the bomb is planted"
		},
		bombDefused: {
			name: "Bomb Defused",
			type: "SingleTrigger",
			description: "Triggered when the bomb is defused."
		},
		bombExploded: {
			name: "Bomb Exploded",
			description: "Triggers when a bomb is exploded.",
			type: "SingleTrigger",
		},
		roundLoss: {
			name: "Round Loss",
			description: "Triggers when the round is lost.",
			type: "SingleTrigger"
		},
		roundWin: {
			name: "Round Win",
			description: "Triggers when the round is won.",
			type: "SingleTrigger"
		}
	}
}