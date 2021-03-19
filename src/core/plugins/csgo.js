const CSGameState = require('cs-gamestate');

module.exports = {
	name: "csgo",
	async init()
	{
		this.gamestateIntegration = new CSGameState({ createServer: false });
		this.installWebhook()

		this.gamestateIntegration.on('player.team', (team) => {
			this.state.csgoTeam = team;
		})

		this.gamestateIntegration.on('round.bomb', (bombState) =>
		{
			switch (bombState)
			{
				case 'planted':
					this.actions.trigger('csgoBombPlant', {});
					break;
				case 'defused':
					this.actions.trigger('csgoBombDefused', {});
					break;
				case 'exploded':
					this.actions.trigger('csgoBombExploded', {});
					break;
			}
		});

		this.gamestateIntegration.on("player.state.health", (health) =>
		{
			this.state.csgoHealth = health;
		});

		this.gamestateIntegration.on('player.match_stats.kills', (kills) =>
		{
			this.state.csgoKills = kills;
			if (kills > 0) 
			{
				this.actions.trigger('csgoKill', {});
			}
		})

		this.gamestateIntegration.on('player.match_stats.deaths', (deaths) =>
		{
			this.state.csgoDeaths = deaths;
			if (deaths > 0)
			{
				this.actions.trigger('csgoDeath', {});
			}
		})

		this.gamestateIntegration.on('player.match_stats.assists', (assists) =>
		{
			this.state.csgoAssists = assists;
		})

		this.gamestateIntegration.on('round.win_team', (winTeam) => {

			if (winTeam == this.state.csgoTeam)
			{
				this.actions.trigger('csgoRoundWin', {});
			}
			else
			{
				this.actions.trigger('csgoRoundLoss', {});
			}
		});
	},
	methods: {
		async installWebhook()
		{
			const routes = this.webServices.routes;
			routes.post(`/csgo`, (req, res) =>
			{
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
		csgoHealth: { type: Number, name: "Health" },
		csgoKills: { type: Number, name: "Kills" },
		csgoDeaths: { type: Number, name: "Deaths" },
		csgoAssists: { type: Number, name: "Assists" },
	},
	triggers: {
		csgoDeath: {
			name: "CSGO Death",
		},
		csgoKill: {
			name: "CSGO Death",
		},
		csgoBombPlant: {
			name: "CSGO Bomb Planted",
			description: "Triggers when a bomb is planted."
		},
		csgoBombDefused: {
			name: "CSGO Bomb Defused",
			description: "Triggers when a bomb is defused."
		},
		csgoBombExploded: {
			name: "CSGO Bomb Exploded",
			description: "Triggers when a bomb is exploded."
		},
		csgoRoundLoss: {
			name: "CSGO Round Loss",
			description: "Triggers when the round is lost."
		},
		csgoRoundWin: {
			name: "CSGO Round Win",
			description: "Triggers when the round is won."
		}
	}
}