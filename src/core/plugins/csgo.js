const CSGameState = require('cs-gamestate');

module.exports = {
	name: "csgo",
	uiName: "Counter Strike",
	icon: "mdi-pistol",
	color: "#6E72AD",
	async init()
	{
		this.gamestateIntegration = new CSGameState({ createServer: false });
		this.installWebhook()

		this.gamestateIntegration.on('player.team', (team) =>
		{
			this.state.team = team;
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
			this.state.health = health;
		});

		this.gamestateIntegration.on('player.match_stats.kills', (kills) =>
		{
			this.state.kills = kills;
			if (kills > 0) 
			{
				this.actions.trigger('csgoKill', { kills });
			}
		})

		this.gamestateIntegration.on('player.match_stats.deaths', (deaths) =>
		{
			this.state.deaths = deaths;
			if (deaths > 0)
			{
				this.actions.trigger('csgoDeath', { deaths });
			}
		})

		this.gamestateIntegration.on('player.match_stats.assists', (assists) =>
		{
			this.state.assists = assists;
		})

		this.gamestateIntegration.on('round.win_team', (winTeam) =>
		{

			if (winTeam == this.state.team)
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
		health: { type: Number, name: "Health" },
		kills: { type: Number, name: "Kills" },
		deaths: { type: Number, name: "Deaths" },
		assists: { type: Number, name: "Assists" },
	},
	triggers: {
		csgoDeath: {
			name: "Death",
			type: "NumberTrigger",
			numberText: "Deaths",
			key: "deaths",
			description: "Triggered on when you die in CS:GO"
		},
		csgoKill: {
			name: "Kill",
			type: "NumberTrigger",
			numberText: "Kills",
			key: "kills",
			description: "Triggered when you get a kill in CS:GO"
		},
		csgoBombPlant: {
			name: "Bomb Planted",
			type: "SingleTrigger",
			description: "Triggered when the bomb is planted"
		},
		csgoBombDefused: {
			name: "Bomb Defused",
			type: "SingleTrigger",
			description: "Triggered when the bomb is defused."
		},
		csgoBombExploded: {
			name: "Bomb Exploded",
			description: "Triggers when a bomb is exploded.",
			type: "SingleTrigger",
		},
		csgoRoundLoss: {
			name: "Round Loss",
			description: "Triggers when the round is lost.",
			type: "SingleTrigger"
		},
		csgoRoundWin: {
			name: "Round Win",
			description: "Triggers when the round is won.",
			type: "SingleTrigger"
		}
	}
}