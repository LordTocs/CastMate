const axios = require('axios');
const get = require('lodash/get');

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
            if (!playerName) {
                playerName = 'FitzBro';
            }

            const response = await axios.get(`https://aoeiv.net/api/leaderboard?game=aoe4&leaderboard_id=17&search=${playerName}`);
            const result = get(response, ['data', 'leaderboard', 0]);
        
            if (result) {
                console.log(result);

                return `⚔️ ${result.name} ⚔️ Rank: ${result.rank} - Elo: ${result.rating} - W/L: ${result.wins}/${result.losses} - Win Streak: ${result.streak}`;
                
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
