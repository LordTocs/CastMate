const axios = require('axios');
const https = require('https');

module.exports = {
    name: "aoe4",
    uiName: "Age Of Empires 4",
    async init() {

    },
    templateFunctions: {
        async getAoe4PlayerStat(playerName) {
            if (!playerName.length) {
                playerName = "FitzBro";
            }

            const agent = new https.Agent({
                rejectUnauthorized: false
            });

            let response = await axios.get('https://aoeiv.net/api/leaderboard', {
                httpsAgent: agent,
                params: {
                    game: "aoe4",
                    leaderboard_id: 17,
                    search: playerName
                }
            })

            // Search for exact string matches
            // 
            // Select highest elo

            if (response.data.leaderboard && response.data.leaderboard.length) {
                let result = response.data.leaderboard.find((player) => {
                    return player.name.toLowerCase() === playerName.toLowerCase();
                });
                result = (result || response.data.leaderboard[0]);

                let formattedResult = {};
                formattedResult.userName = result.name;
                formattedResult.elo = result.rating;
                formattedResult.rank = result.rank;
                formattedResult.winPercent = ((result.wins / result.games) * 100).toFixed(2);
                formattedResult.wins = result.wins;
                formattedResult.losses = result.losses;
                formattedResult.streak = result.streak;

                let playerStatString = `⚔️ ${formattedResult.userName} ⚔️ Rank: ${formattedResult.rank} - Elo: ${formattedResult.elo} - Win Rate: ${formattedResult.winPercent}% - W/L: ${formattedResult.wins}/${formattedResult.losses} - Streak: ${formattedResult.streak}`;

                console.log(playerStatString);
                return playerStatString;
            } else {
                return "Could not find player.";
            }
        },

        async getAoe4Top3() {
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