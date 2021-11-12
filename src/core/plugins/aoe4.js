const axios = require('axios');

module.exports = {
    name: "aoe4",
    uiName: "Age Of Empires 4",
    async init() {
        if (this.settings.enabled) {
            console.log("AOE4 IS THE BOMB . COM")
        }
    },
    templateFunctions: {
        async getAoe4PlayerStat(playerName) {
            if (playerName.toLowerCase().includes("fitzbro")) {
                playerName = 'FitzBro'
            }
            let response = await axios.post('https://api.ageofempires.com/api/ageiv/Leaderboard', {
                region: 7,
                versus: "players",
                matchType: "unranked",
                teamSize: "1v1",
                searchPlayer: playerName,
                page: 1,
                count: 100
            })

            if (response.data && response.data.items && response.data.items.length) {
                let result = response.data.items[0];

                let formattedResult = {};
                formattedResult.userName = result.userName;
                formattedResult.elo = result.elo;
                formattedResult.rank = result.rank;
                formattedResult.wins = result.wins;
                formattedResult.winPercent = result.winPercent;
                formattedResult.losses = result.losses;
                formattedResult.winStreak = result.winStreak;

                let playerStatString = `⚔️ ${formattedResult.userName} ⚔️ Rank: ${formattedResult.rank} - Elo: ${formattedResult.elo} - Win Rate: ${formattedResult.winPercent}% - W/L: ${formattedResult.wins}/${formattedResult.losses} - Win Streak: ${formattedResult.winStreak}`;

                console.log(formattedResult);
                return playerStatString;
            } else {
                return "Could not find player.";
            }
        },

        async getAoe4Top5() {
            let response = await axios.post('https://api.ageofempires.com/api/ageiv/Leaderboard', {
                region: 7,
                versus: "players",
                matchType: "unranked",
                teamSize: "1v1",
                searchPlayer: "",
                page: 1,
                count: 1
            })

            if (response.data && response.data.items && response.data.items.length) {
                let items = response.data.items;
                let playerString = `🥇${items[0].userName}🥇 🥈${items[1].userName}🥈 🥉${items[2].userName}🥉`;

                return playerString;
            } else {
                return "Could not find player.";
            }
        },
    },
    settings: {
        enabled: { type: Boolean }
    }
}